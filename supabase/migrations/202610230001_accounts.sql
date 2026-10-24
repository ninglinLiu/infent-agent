begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 20),
  language text not null default 'zh' check (language in ('zh', 'en'))
);
create table public.learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index conversations_owner_created on public.conversations(user_id, created_at desc);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '' check (length(content) <= 100000),
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'complete' check (status in ('pending', 'complete', 'failed', 'cancelled')),
  created_at timestamptz not null default clock_timestamp(),
  foreign key (conversation_id, user_id) references public.conversations(id, user_id) on delete cascade
);
create index messages_owner_conversation on public.messages(user_id, conversation_id, created_at);
create table public.watchlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9.^=-]{1,20}$'),
  created_at timestamptz not null default now(),
  primary key(user_id, symbol)
);
create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index usage_owner_created on public.usage_events(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.learning_progress enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.usage_events enable row level security;

create policy own_profile_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy own_profile_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy own_progress on public.learning_progress for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_conversations on public.conversations for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_messages on public.messages for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_watchlist on public.watchlist_items for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_usage on public.usage_events for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.profiles, public.learning_progress, public.conversations, public.messages, public.watchlist_items, public.usage_events from anon, authenticated;
grant select, update(display_name, language) on public.profiles to authenticated;
grant select, insert, update, delete on public.learning_progress, public.conversations, public.messages, public.watchlist_items to authenticated;
grant select on public.usage_events to authenticated;

create function public.initialize_account() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', ''), 20));
  return new;
end;
$$;
revoke all on function public.initialize_account() from public;
create trigger on_account_created after insert on auth.users for each row execute function public.initialize_account();
insert into public.profiles(id, display_name) select id, left(coalesce(raw_user_meta_data->>'display_name', ''), 20) from auth.users on conflict do nothing;

-- A row lock and partial JSON merge preserve unrelated changes from other tabs.
create function public.save_learning_progress(patch jsonb) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Unauthenticated'; end if;
  if jsonb_typeof(patch) <> 'object' or octet_length(patch::text) > 4096 then raise exception 'Invalid patch'; end if;
  insert into public.learning_progress(user_id, state) values (auth.uid(), patch)
  on conflict(user_id) do update set state = public.learning_progress.state || excluded.state, updated_at = now()
  returning state into result;
  return result;
end;
$$;
revoke all on function public.save_learning_progress(jsonb) from public;
grant execute on function public.save_learning_progress(jsonb) to authenticated;

-- Atomic quota + conversation ownership + both message records. No service-role key.
create function public.begin_chat(p_conversation_id uuid, p_question text, p_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); conversation uuid := p_conversation_id; recent_count integer; daily_count integer;
begin
  if owner_id is null then raise exception 'Unauthenticated'; end if;
  if p_request_id is null or length(trim(p_question)) not between 1 and 4000 then raise exception 'Invalid request'; end if;
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
  if exists(select 1 from public.messages where id = p_request_id) then raise exception 'Duplicate request'; end if;
  if conversation is not null and not exists(select 1 from public.conversations where id = conversation and user_id = owner_id) then
    raise exception 'Conversation not found';
  end if;
  select count(*) filter(where created_at > now() - interval '1 minute'), count(*) into recent_count, daily_count
    from public.usage_events where user_id = owner_id and created_at > now() - interval '24 hours';
  if recent_count >= 5 or daily_count >= 30 then raise exception 'Quota exceeded'; end if;
  insert into public.usage_events(user_id) values (owner_id);
  if conversation is null then
    insert into public.conversations(user_id, title) values (owner_id, left(p_question, 120)) returning id into conversation;
  end if;
  insert into public.messages(conversation_id, user_id, role, content) values (conversation, owner_id, 'user', p_question);
  insert into public.messages(id, conversation_id, user_id, role, status) values (p_request_id, conversation, owner_id, 'assistant', 'pending');
  return conversation;
end;
$$;
revoke all on function public.begin_chat(uuid, text, uuid) from public;
grant execute on function public.begin_chat(uuid, text, uuid) to authenticated;

commit;
