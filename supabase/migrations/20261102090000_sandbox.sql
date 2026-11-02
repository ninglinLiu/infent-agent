begin;
-- Paper-trading sandbox. Additive only: no existing table or function changes.
-- Rows are written exclusively through sandbox_execute / sandbox_reset; clients can only read their own rows.

create table public.sandbox_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  epoch integer not null default 1 check (epoch >= 1),
  cash numeric(14,2) not null default 100000 check (cash >= 0),
  created_at timestamptz not null default now(),
  reset_at timestamptz
);

create table public.sandbox_executions (
  -- The client operation id: retries of the same request are idempotent.
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  epoch integer not null,
  kind text not null check (kind in ('strategy', 'close')),
  strategy_ref text check (strategy_ref ~ '^S-[0-9A-Z]{9}$'),
  title text not null check (length(title) between 1 and 60),
  spec jsonb,
  backtest jsonb,
  checks jsonb not null default '[]'::jsonb,
  cash_before numeric(14,2) not null,
  cash_after numeric(14,2) not null check (cash_after >= 0),
  created_at timestamptz not null default clock_timestamp(),
  unique (id, user_id),
  check (octet_length(coalesce(spec::text, '')) + octet_length(coalesce(backtest::text, '')) + octet_length(checks::text) <= 16000)
);
create index sandbox_executions_owner on public.sandbox_executions(user_id, created_at desc);

create table public.sandbox_orders (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null,
  user_id uuid not null,
  epoch integer not null,
  symbol text not null check (symbol ~ '^[A-Z0-9.]{1,10}$'),
  side text not null check (side in ('buy', 'sell')),
  qty numeric(18,4) not null check (qty > 0),
  quote_price numeric(18,6) not null check (quote_price > 0),
  quoted_at timestamptz not null,
  session text not null check (session in ('open', 'closed')),
  oracle_price numeric(18,6) check (oracle_price > 0),
  oracle_updated_at timestamptz,
  oracle_round text check (oracle_round ~ '^[0-9]{1,40}$'),
  slippage_bps numeric(8,2) not null check (slippage_bps between 0 and 100),
  fill_price numeric(18,6) not null check (fill_price > 0),
  fee numeric(12,2) not null check (fee >= 0),
  notional numeric(16,2) not null check (notional > 0),
  created_at timestamptz not null default clock_timestamp(),
  foreign key (execution_id, user_id) references public.sandbox_executions(id, user_id) on delete cascade
);
create index sandbox_orders_owner on public.sandbox_orders(user_id, epoch, created_at);

-- Current-epoch holdings. security_invoker keeps the base tables' row-level security.
create view public.sandbox_positions with (security_invoker = true) as
  select o.user_id, o.symbol,
    sum(case when o.side = 'buy' then o.qty else -o.qty end) as qty,
    sum(case when o.side = 'buy' then o.notional else -o.notional end) as net_invested,
    max(o.created_at) as last_trade_at
  from public.sandbox_orders o
  join public.sandbox_accounts a on a.user_id = o.user_id and a.epoch = o.epoch
  group by o.user_id, o.symbol
  having sum(case when o.side = 'buy' then o.qty else -o.qty end) > 0;

alter table public.sandbox_accounts enable row level security;
alter table public.sandbox_executions enable row level security;
alter table public.sandbox_orders enable row level security;
create policy own_sandbox_account on public.sandbox_accounts for select to authenticated using (user_id = (select auth.uid()));
create policy own_sandbox_executions on public.sandbox_executions for select to authenticated using (user_id = (select auth.uid()));
create policy own_sandbox_orders on public.sandbox_orders for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.sandbox_accounts, public.sandbox_executions, public.sandbox_orders, public.sandbox_positions from public, anon, authenticated;
grant select on public.sandbox_accounts, public.sandbox_executions, public.sandbox_orders, public.sandbox_positions to authenticated;

-- Fills are priced on the server from live quotes. The function re-checks every invariant it can verify
-- (ownership, quota, arithmetic, slippage band, cash and holdings) so a direct RPC call cannot overdraw the account.
create function public.sandbox_execute(
  p_operation_id uuid, p_kind text, p_title text, p_strategy_ref text,
  p_spec jsonb, p_backtest jsonb, p_checks jsonb, p_orders jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  account public.sandbox_accounts;
  prior public.sandbox_executions;
  item record;
  held numeric;
  recent integer;
  buys numeric := 0; sells numeric := 0; fees numeric := 0;
  next_cash numeric;
begin
  if owner_id is null then raise exception 'Unauthenticated'; end if;
  if p_operation_id is null or p_kind not in ('strategy', 'close') or jsonb_typeof(p_orders) <> 'array'
     or jsonb_array_length(p_orders) not between 1 and 8 or jsonb_typeof(coalesce(p_checks, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid execution';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sandbox:' || owner_id::text, 0));
  select * into prior from public.sandbox_executions where id = p_operation_id;
  if found then
    if prior.user_id <> owner_id then raise exception 'Invalid execution'; end if;
    return jsonb_build_object('execution_id', prior.id, 'cash', prior.cash_after, 'epoch', prior.epoch, 'replayed', true);
  end if;
  insert into public.sandbox_accounts(user_id) values (owner_id) on conflict do nothing;
  select * into account from public.sandbox_accounts where user_id = owner_id for update;
  select count(*) into recent from public.sandbox_executions where user_id = owner_id and created_at > now() - interval '24 hours';
  if recent >= 40 then raise exception 'Quota exceeded'; end if;

  for item in select * from jsonb_to_recordset(p_orders) as x(symbol text, side text, qty numeric, quote_price numeric, fill_price numeric, fee numeric, notional numeric) loop
    if item.qty is null or item.qty <= 0 or item.quote_price <= 0 or item.fill_price <= 0 or item.fee < 0 or item.notional <= 0 then raise exception 'Invalid order'; end if;
    if abs(item.notional - item.qty * item.fill_price) > 0.05 + item.notional * 0.000001 then raise exception 'Invalid order arithmetic'; end if;
    if abs(item.fill_price / item.quote_price - 1) > 0.01 then raise exception 'Fill outside slippage band'; end if;
    if item.side = 'buy' then buys := buys + item.notional;
    elsif item.side = 'sell' then
      select coalesce(sum(case when side = 'buy' then qty else -qty end), 0) into held
        from public.sandbox_orders where user_id = owner_id and epoch = account.epoch and symbol = item.symbol;
      if held < item.qty - 0.0001 then raise exception 'Insufficient position'; end if;
      sells := sells + item.notional;
    else raise exception 'Invalid order'; end if;
    fees := fees + item.fee;
  end loop;
  next_cash := account.cash - buys + sells - fees;
  if next_cash < 0 then raise exception 'Insufficient cash'; end if;

  insert into public.sandbox_executions(id, user_id, epoch, kind, strategy_ref, title, spec, backtest, checks, cash_before, cash_after)
    values (p_operation_id, owner_id, account.epoch, p_kind, p_strategy_ref, left(p_title, 60), p_spec, p_backtest, coalesce(p_checks, '[]'::jsonb), account.cash, next_cash);
  insert into public.sandbox_orders(execution_id, user_id, epoch, symbol, side, qty, quote_price, quoted_at, session, oracle_price, oracle_updated_at, oracle_round, slippage_bps, fill_price, fee, notional)
    select p_operation_id, owner_id, account.epoch, x.symbol, x.side, x.qty, x.quote_price, x.quoted_at, x.session, x.oracle_price, x.oracle_updated_at, x.oracle_round, x.slippage_bps, x.fill_price, x.fee, x.notional
    from jsonb_to_recordset(p_orders) as x(symbol text, side text, qty numeric, quote_price numeric, quoted_at timestamptz, session text, oracle_price numeric, oracle_updated_at timestamptz, oracle_round text, slippage_bps numeric, fill_price numeric, fee numeric, notional numeric);
  update public.sandbox_accounts set cash = next_cash where user_id = owner_id;
  return jsonb_build_object('execution_id', p_operation_id, 'cash', next_cash, 'epoch', account.epoch, 'replayed', false,
    'order_ids', (select jsonb_agg(id order by created_at) from public.sandbox_orders where execution_id = p_operation_id));
end;
$$;

-- Starting over keeps history: the epoch moves forward and old rows stay readable.
create function public.sandbox_reset() returns jsonb language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); result public.sandbox_accounts;
begin
  if owner_id is null then raise exception 'Unauthenticated'; end if;
  perform pg_advisory_xact_lock(hashtextextended('sandbox:' || owner_id::text, 0));
  insert into public.sandbox_accounts(user_id) values (owner_id)
    on conflict (user_id) do update set epoch = public.sandbox_accounts.epoch + 1, cash = 100000, reset_at = now()
    returning * into result;
  return jsonb_build_object('epoch', result.epoch, 'cash', result.cash);
end;
$$;

revoke all on function public.sandbox_execute(uuid, text, text, text, jsonb, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.sandbox_reset() from public, anon, authenticated;
grant execute on function public.sandbox_execute(uuid, text, text, text, jsonb, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.sandbox_reset() to authenticated;
commit;
