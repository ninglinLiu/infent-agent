import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { NextRequest } from 'next/server'
import { safeReturnPath } from '../lib/account/config'
import { accountAuth, readBody } from '../lib/account/server'
import { profilePatch, progressPatch } from '../lib/account/schemas'
import { POST as chat } from '../app/api/chat/route'

test('redirects cannot escape the application', () => {
  for (const path of ['https://evil.test', '//evil.test', '/\\evil.test', '/\n/evil.test', '/\t/evil.test']) assert.equal(safeReturnPath(path), '/dashboard')
  assert.equal(safeReturnPath('/auth/reset-password'), '/auth/reset-password')
})
test('request schemas reject injected ownership/role and invalid progress', () => {
  assert.equal(profilePatch.safeParse({ display_name: 'A', role: 'admin' }).success, false)
  assert.equal(progressPatch.safeParse({ user_id: 'B', lessonStep: 2 }).success, false)
  assert.equal(progressPatch.safeParse({ lessonStep: 7 }).success, false)
  assert.equal(progressPatch.safeParse({ lessonStep: 2 }).success, true)
})
test('unconfigured accounts and cross-origin writes fail closed before model calls', async () => {
  const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
  const previous = keys.map(key => process.env[key])
  keys.forEach(key => delete process.env[key])
  try {
    const res = await chat(new NextRequest('http://localhost/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }) }))
    assert.equal(res.status, 503)
    await assert.rejects(accountAuth.require(new NextRequest('http://localhost/api/profile', { method: 'PATCH', headers: { origin: 'https://evil.test' } })), /Cross-origin/)
    await assert.rejects(readBody(new NextRequest('http://localhost/api/profile', { method: 'PATCH', body: 'x'.repeat(10000) })), /too large/)
  } finally { keys.forEach((key, i) => previous[i] === undefined ? delete process.env[key] : process.env[key] = previous[i]) }
})

test('PostgreSQL migration enforces two-user isolation, ownership, persistence and quota', async () => {
  const db = new PGlite()
  const a = '00000000-0000-4000-8000-000000000001'
  const b = '00000000-0000-4000-8000-000000000002'
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      alter default privileges in schema public grant execute on functions to anon, authenticated;`)
    await db.exec(await readFile('supabase/migrations/202610230001_accounts.sql', 'utf8'))
    await db.exec(await readFile('supabase/migrations/202610230002_function_permissions.sql', 'utf8'))
    await db.query('insert into auth.users(id) values ($1), ($2)', [a, b])
    const asUser = async (id: string) => {
      await db.exec('reset role; set role authenticated')
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id])
    }
    await asUser(a)
    await db.query("update profiles set display_name='Alice' where id=$1", [a])
    await db.query('select save_learning_progress($1::jsonb)', [JSON.stringify({ name: 'Alice', lessonStep: 2 })])
    await db.query('select save_learning_progress($1::jsonb)', [JSON.stringify({ reducedMotion: true })])
    await db.query("insert into watchlist_items(user_id,symbol) values ($1,'BTC')", [a])
    const first = await db.query<{ id: string }>("select begin_chat(null, 'Question A', gen_random_uuid()) as id")
    const conversation = first.rows[0].id
    assert.equal((await db.query('select * from messages')).rows.length, 2)
    assert.equal((await db.query<{ state: { lessonStep: number; reducedMotion: boolean } }>('select state from learning_progress')).rows[0].state.lessonStep, 2)
    await asUser(b)
    for (const table of ['learning_progress', 'conversations', 'messages', 'watchlist_items', 'usage_events']) assert.equal((await db.query(`select * from ${table}`)).rows.length, 0, table)
    assert.equal((await db.query<{ id: string }>('select id from profiles')).rows[0].id, b)
    assert.equal((await db.query("update profiles set display_name='Hijacked' where id=$1 returning id", [a])).rows.length, 0)
    await assert.rejects(db.query('select begin_chat($1, $2, gen_random_uuid())', [conversation, 'Hijack']), /Conversation not found/)
    await assert.rejects(db.query("insert into messages(conversation_id,user_id,role,content) values ($1,$2,'user','Hijack')", [conversation, b]), /foreign key/)
    await assert.rejects(db.query("insert into learning_progress(user_id,state) values ($1,'{}')", [a]), /row-level security/)
    assert.equal((await db.query('delete from conversations where id=$1 returning id', [conversation])).rows.length, 0)
    await assert.rejects(db.query('insert into usage_events(user_id) values ($1)', [b]), /permission denied/)
    await asUser(a)
    assert.equal((await db.query<{ display_name: string }>('select display_name from profiles')).rows[0].display_name, 'Alice')
    assert.equal((await db.query<{ state: { reducedMotion: boolean } }>('select state from learning_progress')).rows[0].state.reducedMotion, true)
    for (let i = 0; i < 4; i++) await db.query('select begin_chat($1, $2, gen_random_uuid())', [conversation, 'More'])
    await assert.rejects(db.query('select begin_chat($1, $2, gen_random_uuid())', [conversation, 'Over quota']), /Quota exceeded/)
    assert.equal((await db.query('select * from usage_events')).rows.length, 5)
    await db.exec('reset role; set role anon')
    await assert.rejects(db.query('select * from profiles'), /permission denied/)
    await assert.rejects(db.query("select begin_chat(null, 'Anonymous', gen_random_uuid())"), /permission denied/)
  } finally { await db.close() }
})
