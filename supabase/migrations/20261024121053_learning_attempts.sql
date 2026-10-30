begin;
create schema if not exists learning_private;
revoke all on schema learning_private from public, anon, authenticated;
grant usage on schema learning_private to authenticated;
-- Explicit opt-in on an isolated local/staging database only. Never enable on production.
create table learning_private.environment (singleton boolean primary key default true check(singleton), allow_demo boolean not null default false);
insert into learning_private.environment values(true, false);
revoke all on learning_private.environment from public, anon, authenticated;

create table public.learning_courses (
  id text not null, script_version text not null, title jsonb not null,
  ordinal integer not null, package_id text,
  availability text not null check(availability in ('published','preparing','internal')),
  primary key(id,script_version)
);
create table public.course_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null, source text not null check(source in ('demo','payment')),
  active boolean not null default true, granted_at timestamptz not null default now(),
  primary key(user_id,package_id)
);
create table public.learning_content (
  course_id text not null, script_version text not null, content jsonb not null,
  primary key(course_id,script_version),
  foreign key(course_id,script_version) references public.learning_courses(id,script_version)
);
create table public.learning_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null, script_version text not null,
  scene integer not null default 1 check(scene between 1 and 4),
  status text not null default 'active' check(status in ('active','stopped','completed','abandoned')),
  revision integer not null default 0,
  cash_cents bigint not null default 1000000 check(cash_cents >= 0),
  shares integer not null default 0 check(shares in (0,40)),
  cost_cents bigint not null default 0, price_cents bigint not null default 10000,
  realized_cents bigint not null default 0,
  total_cents bigint generated always as (cash_cents + shares * price_cents) stored,
  unrealized_cents bigint generated always as (shares * (price_cents - cost_cents)) stored,
  notes text[] not null default '{}', review text,
  parent_id uuid unique references public.learning_attempts(id),
  started_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  foreign key(course_id,script_version) references public.learning_courses(id,script_version),
  unique(id,user_id)
);
create index learning_attempts_owner_recent on public.learning_attempts(user_id,started_at desc);
create table public.learning_choices (
  id uuid primary key, attempt_id uuid not null, user_id uuid not null,
  scene integer not null, action text not null, reason text not null default '',
  created_at timestamptz not null default clock_timestamp(),
  foreign key(attempt_id,user_id) references public.learning_attempts(id,user_id) on delete cascade
);
create index learning_choices_attempt on public.learning_choices(user_id,attempt_id,created_at);
create table learning_private.operations (
  user_id uuid not null references auth.users(id) on delete cascade, id uuid not null,
  payload jsonb not null, result jsonb not null, created_at timestamptz not null default now(),
  primary key(user_id,id)
);
revoke all on learning_private.operations from public,anon,authenticated;

-- Minimal privileged access check; no editable user metadata or client ownership.
create function learning_private.can_access(cid text, ver text) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists (
    select 1 from public.learning_courses c where c.id=cid and c.script_version=ver
    and (c.availability='published' or (c.availability='internal' and exists(select 1 from learning_private.environment where allow_demo)))
    and (c.package_id is null or exists(select 1 from public.course_entitlements e
      where e.user_id=auth.uid() and e.package_id=c.package_id and e.active
      and (e.source='payment' or exists(select 1 from learning_private.environment where allow_demo))))
  );
$$;
revoke all on function learning_private.can_access(text,text) from public,anon,authenticated;
grant execute on function learning_private.can_access(text,text) to authenticated;
alter table public.learning_courses enable row level security;
alter table public.course_entitlements enable row level security;
alter table public.learning_content enable row level security;
alter table public.learning_attempts enable row level security;
alter table public.learning_choices enable row level security;
create policy course_catalog on public.learning_courses for select to authenticated using (
  availability <> 'internal' or learning_private.can_access(id,script_version)
);
create policy own_entitlements on public.course_entitlements for select to authenticated using(user_id=(select auth.uid()));
create policy allowed_content on public.learning_content for select to authenticated using(learning_private.can_access(course_id,script_version));
create policy own_attempts on public.learning_attempts for select to authenticated using(user_id=(select auth.uid()));
create policy own_choices on public.learning_choices for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.learning_courses,public.course_entitlements,public.learning_content,public.learning_attempts,public.learning_choices from public,anon,authenticated;
grant select on public.learning_courses,public.course_entitlements,public.learning_content,public.learning_attempts,public.learning_choices to authenticated;

insert into public.learning_courses values
('coca-cola','v1','{"zh":"可口可乐价值投资练习","en":"Coca-Cola value investing"}',1,null,'published'),
('value-advanced','v1','{"zh":"价值投资进阶案例包 · 筹备中","en":"Advanced value cases · In preparation"}',2,'value-advanced','preparing'),
('value-internal','v1','{"zh":"内部解锁验证 · 基础剧本副本","en":"Internal access test · Copy of the basic script"}',3,'value-advanced','internal');
insert into public.learning_content values ('coca-cola','v1',$content${"disclaimer":{"zh":"本案例借鉴巴菲特的长期投资思想。剧情、价格和交易过程经过教学简化，不是历史行情回放。所有金额均为模拟币。本例暂不计手续费、税费、分红和现金利息。","en":"Inspired by Buffett’s long-term investing ideas. Story, prices and trades are simplified teaching assumptions, not a historical replay. All amounts are simulated credits. Fees, taxes, dividends and cash interest are excluded."},"notes":[{"zh":"识别企业护城河","en":"Identify the business moat"},{"zh":"理解估值假设","en":"Understand the provided valuation"},{"zh":"设定并执行仓位规则","en":"Set and follow position rules"},{"zh":"记录结果并复盘","en":"Record and review the result"}],"scenes":[{"title":{"zh":"审视一家企业——可口可乐","en":"Examine a business — Coca-Cola"},"text":{"zh":"你正在进行一项价值投资练习。面对短期经营数据的波动，你需要先判断：哪些信息影响企业长期竞争力，哪些信息还不足以支持结论？","en":"In this value investing exercise, decide which short-term operating changes affect long-term competitiveness and which are insufficient for a conclusion."},"mentor":{"zh":"先收集品牌、渠道和长期现金流的证据，再判断企业价值。单个季度的数据只是研究的起点。","en":"Gather evidence about the brand, distribution and long-term cash flow before judging value. One quarter is only a starting point."},"choices":[{"id":"research","label":{"zh":"继续查看品牌、渠道与长期现金流，再进入估值分析。","en":"Study the brand, distribution and long-term cash flow, then examine valuation."}},{"id":"wait_quarter","label":{"zh":"仅依据本季度的营收变化，结束进一步研究并选择观望。","en":"Stop further research and wait solely because of this quarter’s revenue change."}}]},{"title":{"zh":"给估值加上安全边际","en":"Allow a margin of safety"},"text":{"zh":"保守估值：125 模拟币／份。当前教学价格：100 模拟币／份。最低安全边际要求：20%。本次建仓上限：初始资金的 40%。安全边际＝（125－100）÷125＝20%。请选择建仓方案，通过本案例的规则检查后执行模拟交易。","en":"Conservative value: 125 credits/share. Teaching price: 100. Required margin of safety: 20%. Position limit: 40% of initial funds. Margin = (125 − 100) / 125 = 20%. Choose a plan; the simulation checks the rules before trading."},"mentor":{"zh":"好企业也需要合适的价格。检查价格是否满足要求，同时遵守事先设定的仓位规则。","en":"A good company still needs a suitable price. Check the valuation requirement and follow the agreed position limit."},"choices":[{"id":"buy_80","label":{"zh":"考虑到公司质量较好，先买入 80 份，再根据后续情况调整。","en":"Buy 80 shares because the company is good, then adjust later."}},{"id":"buy_40","label":{"zh":"按当前规则买入 40 份，保留 6,000 模拟币现金。","en":"Follow the rule: buy 40 shares and retain 6,000 credits in cash."}}]},{"title":{"zh":"股价下跌，重新检查判断依据","en":"Recheck the evidence after a price decline"},"text":{"zh":"市场波动使教学价格降至 79.50。题设已复核：企业的长期竞争力和现金流假设没有发生不利变化，当前也没有触发本案例预设的退出条件。你需要依据原有规则作出决定。","en":"The teaching price falls to 79.50. In this scenario, long-term competitiveness and cash flow assumptions have not deteriorated and no predefined exit condition is triggered. Decide using the original rules."},"mentor":{"zh":"价格变化需要关注，也需要解释。先检查原来的判断依据和退出条件，再决定是否行动。","en":"Notice price changes, but explain them. Check the original evidence and exit conditions before acting."},"choices":[{"id":"hold_rules","label":{"zh":"复核基本面和退出条件，按本案例的既定规则继续持有。","en":"Recheck fundamentals and exit conditions; continue holding under the case rules."}},{"id":"sell_fear","label":{"zh":"仅因为价格下跌，立即卖出全部 40 份。","en":"Immediately sell all 40 shares solely because the price fell."}}]},{"title":{"zh":"时间、结果与复盘","en":"Time, results and reflection"},"text":{"zh":"在这条教学路径中，一段时间后，企业经营表现支持了原先的判断，教学价格变为 194.00。请回顾你的研究、估值和仓位安排，并思考什么信息可能推翻最初的判断。","en":"On this teaching path, later operating results support the original judgment and the teaching price becomes 194.00. Review your research, valuation and position size. What information could overturn the original thesis?"},"mentor":{"zh":"这次结果为正，但一次盈利不能单独证明方法有效。复盘时，请同时检查判断依据、规则执行和没有发生的风险。","en":"This result is positive, but one profit cannot prove a method works. Review the evidence, rule execution and risks that did not materialize."},"choices":[]}],"feedback":{"wait_quarter":{"zh":"观望可以是合理决定，但本次判断主要依赖单季变化，尚未补充长期竞争力和现金流证据。请在下一次尝试中完善研究依据。","en":"Waiting can be reasonable. This decision relied on one quarter without long-term competitiveness or cash flow evidence. Improve the evidence in your next attempt."},"buy_80":{"zh":"该方案超过了本次练习预设的 40% 仓位上限。企业质量与仓位管理需要分别判断，请重新审视资金安排。","en":"This plan exceeds the exercise’s 40% position limit. Company quality and position size are separate decisions. Reconsider the allocation."},"sell_fear":{"zh":"这次卖出没有对应本案例事先设定的退出条件。卖出本身并不必然错误；如果基本面恶化或触发风险规则，退出可以合理。本次练习需要补充的是决策依据。","en":"This sale did not match the predefined exit conditions. Selling is not inherently wrong: deteriorating fundamentals or triggered risk rules can justify it. This exercise calls for a decision supported by evidence."}}}$content$::jsonb);
insert into public.learning_content select 'value-internal','v1',content from public.learning_content where course_id='coca-cola';

-- Published scripts are append-only; future edits require a new script_version.
create function learning_private.immutable_script() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Published script is immutable; create a new version'; end; $$;
create trigger immutable_learning_content before update or delete on public.learning_content for each row execute function learning_private.immutable_script();

-- Only this transaction may mutate attempts. Cents are computed here, never accepted from the browser.
create function learning_private.act(op uuid, cid text, aid uuid, expected integer, action text, reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); a public.learning_attempts; c public.learning_courses;
  payload jsonb; result jsonb; prior learning_private.operations; child public.learning_attempts; latest uuid; oldscene integer;
begin
  if uid is null then raise exception 'Unauthenticated'; end if;
  if op is null or cid is null or action is null or expected is null or expected<0 or reason is null or length(reason)>2000 then raise exception 'Invalid action'; end if;
  payload:=jsonb_build_object('course',cid,'attempt',aid,'revision',expected,'action',action,'reason',reason);
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 726));
  select * into prior from learning_private.operations where user_id=uid and id=op;
  if found then
    if prior.payload<>payload then raise exception 'Operation conflict'; end if;
    return prior.result;
  end if;
  if action='start' then
    select * into a from public.learning_attempts where user_id=uid and course_id=cid order by started_at desc,id desc limit 1;
    if not found then
      select * into c from public.learning_courses where id=cid order by script_version desc limit 1;
      if not found or not learning_private.can_access(c.id,c.script_version) then raise exception 'Course locked'; end if;
      insert into public.learning_attempts(user_id,course_id,script_version) values(uid,c.id,c.script_version) returning * into a;
    elsif not learning_private.can_access(a.course_id,a.script_version) then raise exception 'Course locked';
    end if;
  else
    select * into a from public.learning_attempts where id=aid and user_id=uid for update;
    if not found or a.course_id<>cid then raise exception 'Attempt not found'; end if;
    if not learning_private.can_access(a.course_id,a.script_version) then raise exception 'Course locked'; end if;
    if action='reset' then
      select * into child from public.learning_attempts where parent_id=a.id and user_id=uid;
      if found then
        a:=child;
      else
        select id into latest from public.learning_attempts where user_id=uid and course_id=cid order by started_at desc,id desc limit 1;
        if latest<>a.id or a.revision<>expected then raise exception 'Stale attempt'; end if;
        if a.status='active' then update public.learning_attempts set status='abandoned', revision=revision+1,updated_at=clock_timestamp() where id=a.id; end if;
        insert into public.learning_attempts(user_id,course_id,script_version,parent_id) values(uid,cid,a.script_version,a.id) returning * into a;
      end if;
    else
      if a.revision<>expected or a.status<>'active' then raise exception 'Stale attempt'; end if;
      oldscene:=a.scene;
      if a.scene=1 and action='research' then a.scene:=2; a.notes:=array['moat'];
      elsif a.scene=1 and action='wait_quarter' then a.status:='stopped';
      elsif a.scene=2 and action='buy_80' then a.status:='stopped';
      elsif a.scene=2 and action='buy_40' then
        -- Trade at 100.00, then advance the scenario quote to 79.50.
        a.shares:=40; a.cost_cents:=10000; a.cash_cents:=a.cash_cents-40*10000;
        a.scene:=3; a.price_cents:=7950; a.notes:=array['moat','valuation','position'];
      elsif a.scene=3 and action='hold_rules' then a.scene:=4; a.price_cents:=19400;
      elsif a.scene=3 and action='sell_fear' then
        a.cash_cents:=a.cash_cents+a.shares*a.price_cents;
        a.realized_cents:=a.realized_cents+a.shares*(a.price_cents-a.cost_cents);
        a.shares:=0; a.cost_cents:=0; a.status:='stopped';
      elsif a.scene=4 and action='review' and reason ~ '[^[:space:]]' and length(trim(reason)) between 1 and 2000 then
        a.review:=trim(reason); a.status:='completed'; a.completed_at:=clock_timestamp(); a.notes:=array['moat','valuation','position','review'];
      else raise exception 'Invalid action'; end if;
      update public.learning_attempts set scene=a.scene,status=a.status,revision=revision+1,
        cash_cents=a.cash_cents,shares=a.shares,cost_cents=a.cost_cents,price_cents=a.price_cents,
        realized_cents=a.realized_cents,notes=a.notes,review=a.review,completed_at=a.completed_at,updated_at=clock_timestamp()
        where id=a.id returning * into a;
      insert into public.learning_choices(id,attempt_id,user_id,scene,action,reason) values(op,a.id,uid,oldscene,action,reason);
    end if;
  end if;
  result:=to_jsonb(a);
  insert into learning_private.operations(user_id,id,payload,result) values(uid,op,payload,result);
  return result;
end;
$$;
revoke all on function learning_private.act(uuid,text,uuid,integer,text,text) from public,anon,authenticated;
grant execute on function learning_private.act(uuid,text,uuid,integer,text,text) to authenticated;
create function public.learning_act(p_operation_id uuid,p_course_id text,p_attempt_id uuid,p_revision integer,p_action text,p_reason text)
returns jsonb language sql security invoker set search_path='' as $$
select learning_private.act(p_operation_id,p_course_id,p_attempt_id,p_revision,p_action,p_reason);
$$;
revoke all on function public.learning_act(uuid,text,uuid,integer,text,text) from public,anon,authenticated;
grant execute on function public.learning_act(uuid,text,uuid,integer,text,text) to authenticated;

-- No public grant endpoint. Database owner may issue demo grants only on opted-in test DBs.
create function learning_private.grant_demo(uid uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from learning_private.environment where allow_demo) then raise exception 'Test environment required'; end if;
  insert into public.course_entitlements(user_id,package_id,source) values(uid,'value-advanced','demo')
  on conflict(user_id,package_id) do update set source='demo',active=true,granted_at=now()
  where public.course_entitlements.source='demo';
end;
$$;
revoke all on function learning_private.grant_demo(uuid) from public,anon,authenticated;

-- Actual auth timestamps, not page visits. Dashboard SQL only, never exposed through learner APIs.
create view learning_private.mentor_summary with (security_invoker=true) as
select u.id as user_id,p.display_name,u.created_at as registered_at,u.last_sign_in_at,
  case when u.email is null then null else left(u.email,1)||'***@'||split_part(u.email,'@',2) end as masked_email,
  (u.email_confirmed_at is not null) as email_verified,
  (select count(*) from public.conversations x where x.user_id=u.id) as conversation_count,
  (select count(*) from public.learning_attempts x where x.user_id=u.id) as attempt_count,
  (select count(*) from public.learning_attempts x where x.user_id=u.id and x.status='completed') as completed_count,
  a.id as attempt_id,a.course_id,a.script_version,a.scene,a.status,a.updated_at as last_learning_at,
  a.cash_cents,a.shares,a.price_cents,a.total_cents,a.unrealized_cents,a.realized_cents,
  (a.review is not null) as review_submitted,
  (select jsonb_build_object('action',x.action,'reason',x.reason,'at',x.created_at) from public.learning_choices x where x.attempt_id=a.id order by created_at desc limit 1) as last_choice,
  (select coalesce(jsonb_agg(jsonb_build_object('package',e.package_id,'source',e.source,'active',e.active)), '[]'::jsonb) from public.course_entitlements e where e.user_id=u.id) as entitlements
from auth.users u join public.profiles p on p.id=u.id
left join lateral (select * from public.learning_attempts x where x.user_id=u.id order by started_at desc,id desc limit 1) a on true;
create view learning_private.choice_timeline with (security_invoker=true) as
select a.course_id,a.script_version,c.* from public.learning_choices c join public.learning_attempts a on a.id=c.attempt_id;
revoke all on learning_private.mentor_summary,learning_private.choice_timeline from public,anon,authenticated;
revoke all on function learning_private.immutable_script() from public,anon,authenticated;

alter table public.conversations add column updated_at timestamptz not null default now();
update public.conversations c set updated_at=coalesce((select max(created_at) from public.messages m where m.conversation_id=c.id),c.created_at);
create function learning_private.touch_conversation() returns trigger language plpgsql security invoker set search_path='' as $$
begin update public.conversations set updated_at=clock_timestamp() where id=new.conversation_id; return new; end; $$;
create trigger message_activity after insert or update on public.messages for each row execute function learning_private.touch_conversation();
revoke all on function learning_private.touch_conversation() from public,anon,authenticated;
commit;
