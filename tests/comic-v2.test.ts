import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import type { Attempt, CourseContent } from '../lib/account/learning'
import { comicChoices, comicEnding } from '../lib/account/comic-outcome'

test('four-decision case: all sixteen paths persist, complete, remain isolated, and preserve v1',async()=>{
 const db=new PGlite();const uid=randomUUID(),other=randomUUID()
 const as=async(id:string)=>{await db.exec('reset role;set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id])}
 const act=async(action:string,a?:Attempt,op=randomUUID(),reason='')=>(await db.query<{result:Attempt}>('select learning_act($1,$2,$3,$4,$5,$6) result',[op,'coca-cola',a?.id??null,a?.revision??0,action,reason])).rows[0].result
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email text,created_at timestamptz default now(),last_sign_in_at timestamptz,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`)
  for(const f of ['202610230001_accounts.sql','202610230002_function_permissions.sql','20261024121053_learning_attempts.sql'])await db.exec(await readFile('supabase/migrations/'+f,'utf8'))
  await db.query('insert into auth.users(id) values ($1),($2)',[uid,other]);await as(uid)
  const legacy=await act('start');assert.equal(legacy.script_version,'v1')
  await db.exec('reset role');await db.exec(await readFile('supabase/migrations/20261030033311_branching_comic_v2.sql','utf8'));await as(uid)
  const old=await act('wait_quarter',legacy);assert.equal(old.status,'stopped');assert.equal(old.script_version,'v1')
  const content=(await db.query<{content:CourseContent}>("select content from learning_content where course_id='coca-cola' and script_version='v2'")).rows[0].content
  assert.deepEqual(content,JSON.parse(await readFile('content/courses/coca-cola-v2.json','utf8')))
  let current=await act('start');assert.equal(current.script_version,'v2');assert.equal((await act('start')).id,current.id)
  const seen=new Set<number>()
  for(const research of ['research','wait_quarter'])for(const entry of ['buy_40','reserve_cash'])for(const change of [0,1])for(const final of ['keep_position','exit_position']){
   if(current.revision>0)current=await act('reset',current)
   const first=current.id;assert.equal(current.scene,1)
   current=await act(research,current)
   const before=current,op=randomUUID();current=await act(entry,before,op,'Capital allocation');assert.deepEqual(await act(entry,before,op,'Capital allocation'),current)
   await assert.rejects(act(entry,before),/Stale attempt/)
   assert.equal(current.status,'active');assert.equal(current.scene,3)
   assert.equal(comicChoices(content,current).length,2)
   const third=entry==='buy_40'?(change?'reduce_exposure':'hold_rules'):(change?'enter_pullback':'retain_cash')
   await assert.rejects(act(entry==='buy_40'?'enter_pullback':'reduce_exposure',current),/Invalid action/)
   current=await act(third,current);assert.equal(current.scene,4);assert.equal(current.status,'active')
   const snapshot=current,finishOp=randomUUID();current=await act(final,snapshot,finishOp,'Recheck demand before adding capital.')
   assert.deepEqual(await act(final,snapshot,finishOp,'Recheck demand before adding capital.'),current)
   assert.equal(current.status,'completed');assert.ok(current.completed_at);assert.equal(current.revision,4)
   const choices=(await db.query<{scene:number;action:string}>('select scene,action from learning_choices where attempt_id=$1 order by scene',[first])).rows
   assert.deepEqual(choices.map(c=>c.scene),[1,2,3,4]);assert.deepEqual(choices.map(c=>c.action),[research,entry,third,final])
   const expected=entry==='buy_40'?(change?918000:1376000):(change?1458000:1000000)
   assert.equal(current.total_cents,expected);seen.add(expected)
   assert.equal(current.cash_cents+current.shares*current.price_cents,current.total_cents)
   assert.equal(current.realized_cents+current.unrealized_cents,current.total_cents-1000000)
   assert.ok(comicEnding(choices as never).title.en)
   await as(other);assert.equal((await db.query('select * from learning_attempts')).rows.length,0);assert.equal((await db.query('select * from learning_choices')).rows.length,0)
   await assert.rejects(act('reset',current),/Attempt not found/);await assert.rejects(db.exec('update learning_attempts set status=\'completed\''),/permission denied/);await as(uid)
  }
  assert.equal(seen.size,4)
  await db.exec('reset role;set role anon');await assert.rejects(db.query("select learning_act(gen_random_uuid(),'coca-cola',null,0,'start','')"),/permission denied/)
 }finally{await db.close()}
})
