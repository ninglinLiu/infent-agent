import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { NextRequest } from 'next/server'
import { POST as auth, GET as getAuth } from '../app/api/local/auth/route'
import { POST as chat } from '../app/api/chat/route'
import { GET as conversations } from '../app/api/conversations/route'
import { POST as sandbox, GET as portfolio } from '../app/api/sandbox/route'
import { GET as learning } from '../app/api/learning/route'
import { splitMeta, splitEvents } from '../lib/ai/protocol'
import { localDatabase } from '../lib/local/database'
async function main() {
process.env.NEXT_PUBLIC_LOCAL_DEMO='1';process.env.OMNIAI_LOCAL_DEMO='1';process.env.OMNIAI_MODEL_MODE='offline'
delete process.env.VERCEL
process.env.OMNIAI_DATA_DIR=await mkdtemp(path.join(tmpdir(),'omniai-demo-test-'))
globalThis.fetch=async()=>{throw new Error('Network disabled for integration test')}
const request=(url:string,body?:unknown,cookie='')=>new NextRequest(`http://localhost:3000${url}`,{method:body?'POST':'GET',headers:{cookie,origin:'http://localhost:3000','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})
try {
  const a=await auth(request('/api/local/auth',{action:'register',email:'a@example.invalid',password:'Demo-test-123',name:'A'}));assert.equal(a.status,200,await a.clone().text())
  const ca=a.headers.get('set-cookie')!.split(';')[0]
  const b=await auth(request('/api/local/auth',{action:'register',email:'b@example.invalid',password:'Demo-test-123',name:'B'}));assert.equal(b.status,200)
  const cb=b.headers.get('set-cookie')!.split(';')[0]
  assert.equal((await learning(request('/api/learning',undefined,ca))).status,200)
  let cid:string|undefined
  const ids=new Set<string>()
  let spec:unknown
  for(const question of ['科技策略','降低回撤','加入黄金']){
    const r=await chat(request('/api/chat',{messages:[{role:'user',content:question}],conversationId:cid},ca));assert.equal(r.status,200)
    cid=r.headers.get('x-conversation-id')!
    const parsed=splitMeta(await r.text());assert.equal(parsed.meta?.demo,true)
    assert.ok(splitEvents(parsed.text).events.length>=2)
    const result=parsed.meta!.tools![0].result;assert.equal(result.ok,true)
    if(result.ok){ids.add(result.data.strategyId as string);spec=result.data.spec}
  }
  assert.equal(ids.size,3)
  const history=await (await conversations(request(`/api/conversations?id=${cid}`,undefined,ca))).json();assert.equal(history.messages.length,6)
  assert.equal((await conversations(request(`/api/conversations?id=${cid}`,undefined,cb))).status,404)
  const operationId=crypto.randomUUID()
  const execute=()=>sandbox(request('/api/sandbox',{action:'execute',operationId,spec},ca))
  const report=await execute();assert.equal(report.status,200,await report.clone().text());assert.equal((await report.json()).plan.ok,true)
  assert.equal((await execute()).status,200)
  const pa=await (await portfolio(request('/api/sandbox',undefined,ca))).json();assert.equal(pa.executions.length,1);assert.ok(pa.positions.length>0)
  const pb=await (await portfolio(request('/api/sandbox',undefined,cb))).json();assert.equal(pb.executions.length,0)
  const uid=(await (await getAuth(request('/api/local/auth',undefined,ca))).json()).data.user.id
  const db=await localDatabase()
  // More than the old 30/day allowance, spaced outside the minute window.
  await db.query("insert into usage_events(user_id,created_at) select $1,now()-interval '2 hours' from generate_series(1,30)",[uid])
  assert.equal((await chat(request('/api/chat',{messages:[{role:'user',content:'科技策略'}]},ca))).status,200)
  const logout=await auth(request('/api/local/auth',{action:'logout'},ca));assert.equal(logout.status,200)
  assert.equal((await getAuth(request('/api/local/auth',undefined,ca))).status,200)
  assert.equal((await (await getAuth(request('/api/local/auth',undefined,ca))).json()).data.user,null)
  const login=await auth(request('/api/local/auth',{action:'login',email:'a@example.invalid',password:'Demo-test-123'}));assert.equal(login.status,200)
  assert.equal((await auth(request('/api/local/auth',{action:'login',email:'a@example.invalid',password:'wrong'}))).status,401)
  console.log('PASS: fresh signup, 3 distinct strategy revisions, history, user isolation, idempotent execution, >30 requests/day, logout/login; ALL network disabled.')
} finally { await (await localDatabase()).close() }
}
main().catch(error=>{console.error(error);process.exitCode=1})
