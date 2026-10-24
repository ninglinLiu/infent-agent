import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import type { Attempt } from '../lib/account/learning'
import { learningAction } from '../lib/account/learning'
import { formatLearningContext } from '../lib/account/learning-context'

test('learning input rejects client balances, user IDs and unknown actions; empty history invents nothing', () => {
  const base = { operationId: randomUUID(), action: 'start', courseId: 'coca-cola' }
  assert.equal(learningAction.safeParse(base).success, true)
  for (const extra of [{ user_id: randomUUID() }, { cash_cents: 9999999 }, { scene: 4 }, { action: 'grant_payment' }]) assert.equal(learningAction.safeParse({ ...base, ...extra }).success, false)
  assert.equal(formatLearningContext(null, null), '')
})

test('local PostgreSQL: versioned attempts, branches, ownership, idempotency, entitlements and mentor privacy', async () => {
  const db = new PGlite()
  const ids = [randomUUID(), randomUUID(), randomUUID()]
  const as = async (id: string) => { await db.exec('reset role; set role authenticated'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]) }
  const owner = () => db.exec('reset role')
  const act = async (action: string, a?: Attempt, reason = '', op = randomUUID(), course = 'coca-cola') => {
    const result = await db.query<{ result: Attempt }>('select public.learning_act($1,$2,$3,$4,$5,$6) as result', [op,course,a?.id ?? null,a?.revision ?? 0,action,reason])
    return result.rows[0].result
  }
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}', email text, created_at timestamptz default now(), last_sign_in_at timestamptz, email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;
      alter default privileges in schema public grant all on tables to anon,authenticated;
      alter default privileges in schema public grant execute on functions to anon,authenticated;`)
    for (const file of ['202610230001_accounts.sql','202610230002_function_permissions.sql','20261024121053_learning_attempts.sql']) await db.exec(await readFile(`supabase/migrations/${file}`,'utf8'))
    for (const [i,id] of ids.entries()) await db.query("insert into auth.users(id,email,last_sign_in_at) values($1,$2,'2026-01-01')",[id,`student${i}@example.invalid`])
    const content = (await db.query<{content: unknown}>("select content from learning_content where course_id='coca-cola'")).rows[0].content
    assert.deepEqual(content, JSON.parse(await readFile('content/courses/coca-cola-v1.json','utf8')))
    await as(ids[0])
    let a = await act('start')
    const first = a.id
    assert.equal((await act('start')).id, first)
    await assert.rejects(act('buy_40',a), /Invalid action/)
    a = await act('research',a,'Investigate the moat')
    const buyOp = randomUUID(), beforeBuy = a
    a = await act('buy_40',beforeBuy,'Position limit',buyOp)
    assert.deepEqual(await act('buy_40',beforeBuy,'Position limit',buyOp),a)
    await assert.rejects(act('buy_40',beforeBuy,'Changed reason',buyOp),/Operation conflict/)
    await assert.rejects(act('buy_40',beforeBuy),/Stale attempt/)
    assert.equal(a.cash_cents,600000); assert.equal(a.shares,40); assert.equal(a.total_cents,918000); assert.equal(a.unrealized_cents,-82000)
    assert.equal(a.scene,3); assert.deepEqual(a.notes,['moat','valuation','position'])
    await db.query("select begin_chat(null,'A research question',gen_random_uuid())")
    const text = formatLearningContext(a,{action:'buy_40',reason:'Position limit'})
    assert.match(text,/918000/); assert.match(text,/"scene":3/)
    await as(ids[2])
    for (const table of ['learning_attempts','learning_choices','course_entitlements','conversations','messages']) assert.equal((await db.query(`select * from ${table}`)).rows.length,0)
    await assert.rejects(act('sell_fear',a),/Attempt not found/)
    assert.equal((await db.query("select * from learning_content where course_id='value-internal'")).rows.length,0)
    await assert.rejects(act('start',undefined,'',randomUUID(),'value-internal'),/Course locked/)
    await assert.rejects(db.query("insert into course_entitlements values($1,'value-advanced','demo',true,now())",[ids[2]]),/permission denied/)
    await assert.rejects(db.exec("update learning_attempts set cash_cents=9999999"),/permission denied/)
    await assert.rejects(db.exec('select * from learning_private.mentor_summary'),/permission denied/)
    await assert.rejects(db.query('select learning_private.grant_demo($1)',[ids[2]]),/permission denied/)
    await as(ids[0])
    assert.equal((await db.query<{scene: number}>('select scene from learning_attempts where id=$1',[a.id])).rows[0].scene,3)
    const saleOp = randomUUID(), beforeSale = a
    a = await act('sell_fear',beforeSale,'Price only',saleOp)
    assert.deepEqual(await act('sell_fear',beforeSale,'Price only',saleOp),a)
    assert.equal(a.cash_cents,918000); assert.equal(a.shares,0); assert.equal(a.unrealized_cents,0); assert.equal(a.realized_cents,-82000)
    await assert.rejects(act('hold_rules',a),/Stale attempt/)
    const resetOp=randomUUID(), old=a
    a=await act('reset',old,'',resetOp)
    assert.deepEqual(await act('reset',old,'',resetOp),a)
    assert.equal((await act('reset',old)).id,a.id)
    assert.notEqual(a.id,old.id); assert.equal(a.total_cents,1000000)
    assert.equal((await db.query('select * from learning_attempts')).rows.length,2)
    a=await act('wait_quarter',a)
    assert.equal(a.cash_cents,1000000); assert.equal(a.shares,0)
    a=await act('reset',a); a=await act('research',a); a=await act('buy_80',a)
    assert.equal(a.cash_cents,1000000); assert.equal(a.shares,0); assert.equal(a.status,'stopped')
    await as(ids[1])
    let b=await act('start'); b=await act('research',b); b=await act('buy_40',b); b=await act('hold_rules',b)
    assert.equal(b.total_cents,1376000); assert.equal(b.unrealized_cents,376000); assert.equal(b.realized_cents,0)
    await assert.rejects(act('review',b,' '),/Invalid action/)
    await assert.rejects(act('review',b,'\n\t'),/Invalid action/)
    const reviewOp=randomUUID(), beforeReview=b
    b=await act('review',b,'Reassess if cash flow assumptions deteriorate.',reviewOp)
    assert.deepEqual(await act('review',beforeReview,'Reassess if cash flow assumptions deteriorate.',reviewOp),b)
    assert.equal(b.status,'completed'); assert.ok(b.completed_at); assert.ok(b.notes.includes('review'))
    const next=await act('reset',b)
    assert.equal(next.cash_cents,1000000)
    assert.equal((await db.query<{status:string}>('select status from learning_attempts where id=$1',[b.id])).rows[0].status,'completed')
    await owner()
    await assert.rejects(db.query('select learning_private.grant_demo($1)',[ids[1]]),/Test environment required/)
    await db.exec('update learning_private.environment set allow_demo=true')
    await db.query('select learning_private.grant_demo($1)',[ids[1]])
    await as(ids[1])
    assert.equal((await db.query("select * from learning_content where course_id='value-internal'")).rows.length,1)
    assert.equal((await act('start',undefined,'',randomUUID(),'value-internal')).course_id,'value-internal')
    await as(ids[0])
    assert.equal((await db.query("select * from learning_content where course_id='value-internal'")).rows.length,0)
    await owner()
    const summary=await db.query<{user_id:string; masked_email:string; conversation_count:number; last_sign_in_at:Date}>('select * from learning_private.mentor_summary')
    assert.equal(summary.rows.length,3); assert.ok(summary.rows.every(row=>row.masked_email.startsWith('s***@')))
    assert.equal(Number(summary.rows.find(row=>row.user_id===ids[0])?.conversation_count),1)
    assert.ok((await db.query('select * from learning_private.choice_timeline')).rows.length>0)
    await assert.rejects(db.exec("update learning_content set content='{}'"),/immutable/)
    await db.exec('set role anon')
    await assert.rejects(db.query("select learning_act(gen_random_uuid(),'coca-cola',null,0,'start','')"),/permission denied/)
  } finally { await db.close() }
})
