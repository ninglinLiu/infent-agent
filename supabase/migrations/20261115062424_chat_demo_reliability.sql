begin;
-- Keep a bounded, atomic per-account allowance. 30/day stopped an actual
-- research session; 100/day permits rehearsal without removing abuse limits.
create or replace function public.begin_chat(p_conversation_id uuid, p_question text, p_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); conversation uuid := p_conversation_id; recent_count integer; daily_count integer;
begin
  if owner_id is null then raise exception 'Unauthenticated'; end if;
  if p_request_id is null or p_question is null or length(trim(p_question)) not between 1 and 4000 then raise exception 'Invalid request'; end if;
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
  if exists(select 1 from public.messages where id = p_request_id) then raise exception 'Duplicate request'; end if;
  if conversation is not null and not exists(select 1 from public.conversations where id = conversation and user_id = owner_id) then
    raise exception 'Conversation not found';
  end if;
  select count(*) filter(where created_at > now() - interval '1 minute'), count(*) into recent_count, daily_count
    from public.usage_events where user_id = owner_id and created_at > now() - interval '24 hours';
  if recent_count >= 10 then raise exception 'Minute quota exceeded'; end if;
  if daily_count >= 100 then raise exception 'Daily quota exceeded'; end if;
  insert into public.usage_events(user_id) values (owner_id);
  if conversation is null then
    insert into public.conversations(user_id, title) values (owner_id, left(p_question, 120)) returning id into conversation;
  end if;
  insert into public.messages(conversation_id, user_id, role, content) values (conversation, owner_id, 'user', p_question);
  insert into public.messages(id, conversation_id, user_id, role, status) values (p_request_id, conversation, owner_id, 'assistant', 'pending');
  return conversation;
end;
$$;
revoke all on function public.begin_chat(uuid,text,uuid) from public,anon;
grant execute on function public.begin_chat(uuid,text,uuid) to authenticated;
commit;
