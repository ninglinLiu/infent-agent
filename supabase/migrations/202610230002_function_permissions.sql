begin;
-- Supabase grants these roles EXECUTE via default privileges independently of PUBLIC.
revoke all on function public.initialize_account() from public, anon, authenticated;
revoke all on function public.save_learning_progress(jsonb) from public, anon, authenticated;
revoke all on function public.begin_chat(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.save_learning_progress(jsonb) to authenticated;
grant execute on function public.begin_chat(uuid, text, uuid) to authenticated;
revoke all on sequence public.usage_events_id_seq from anon, authenticated;
commit;
