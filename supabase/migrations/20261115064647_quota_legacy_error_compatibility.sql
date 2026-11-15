begin;
-- The currently deployed website recognizes the literal "Quota exceeded".
-- Keep that sentinel until the clearer client error handling is published.
do $$
declare definition text;
begin
  definition := pg_get_functiondef('public.begin_chat(uuid,text,uuid)'::regprocedure);
  definition := replace(definition, '''Minute quota exceeded''', '''Minute quota exceeded (Quota exceeded)''');
  definition := replace(definition, '''Daily quota exceeded''', '''Daily quota exceeded (Quota exceeded)''');
  execute definition;
end $$;
commit;
