/** Opt-in REAL Supabase Auth staging setup. Never used by the app or browser fixtures. */
import { createClient } from '@supabase/supabase-js'
import { randomUUID, randomBytes } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import type { Attempt } from '../lib/account/learning'

async function main() {
  const url = process.env.LEARNING_TEST_URL
  const key = process.env.LEARNING_TEST_PUBLISHABLE_KEY
  if (!url || !key || process.env.LEARNING_TEST_CONFIRM !== 'isolated-test-database') throw new Error('Set the isolated test URL, publishable key, and LEARNING_TEST_CONFIRM=isolated-test-database.')
  const host = new URL(url).hostname
  if (host === 'bofqqjgdkubmjdnpalqq.supabase.co' || host.endsWith('.vercel.app') || host.endsWith('omniaihello.com')) throw new Error('Production is forbidden.')
  if (!['localhost','127.0.0.1'].includes(host) && host !== process.env.LEARNING_TEST_ALLOWED_HOST) throw new Error('Explicit staging hostname allowlist required.')
  const client = () => createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const path = '.learning-live-accounts.json'
  type DemoUser = { id: string; email: string; password: string; attempt?: string; conversation?: string }
  let users: Record<string,DemoUser> = {}
  try { const existing = JSON.parse(await readFile(path,'utf8')); if (existing.url !== url) throw new Error('Fixture belongs to a different environment.'); users=existing.users } catch(e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e }
  const save = () => writeFile(path,JSON.stringify({url,users},null,2),{mode:0o600})
  const verifyOnly = process.argv.includes('--verify')
  const verified: Record<string, unknown> = {}
  for (const label of ['A','B','C']) {
    const db=client()
    if (!users[label]) {
      if (verifyOnly) throw new Error('Run preparation first.')
      const domain=process.env.LEARNING_TEST_EMAIL_DOMAIN || 'example.test'
      const email=`infent-${label.toLowerCase()}-${Date.now()}@${domain}`
      const password=randomBytes(24).toString('base64url')
      const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:`Demo ${label}`}}})
      if (error) throw error
      if (!data.user) throw new Error('Signup did not create a user.')
      users[label]={id:data.user.id,email,password}; await save()
      if (!data.session) throw new Error('Confirm the test account email in the normal auth flow, then rerun. No confirmation bypass is performed.')
    }
    const u=users[label]
    const signed=await db.auth.signInWithPassword({email:u.email,password:u.password})
    if (signed.error) throw signed.error
    assert.equal(signed.data.user.id,u.id)
    if (!verifyOnly && label !== 'C') {
      const progress=await db.rpc('save_learning_progress',{patch:{name:`Demo ${label}`,storyStep:3}})
      if(progress.error) throw progress.error
    }
    const act=async(action:string,a?:Attempt,reason='') => {
      const r=await db.rpc('learning_act',{p_operation_id:randomUUID(),p_course_id:'coca-cola',p_attempt_id:a?.id ?? null,p_revision:a?.revision ?? 0,p_action:action,p_reason:reason})
      if(r.error) throw r.error
      return r.data as Attempt
    }
    let history=await db.from('learning_attempts').select('*').order('started_at',{ascending:false})
    if(history.error) throw history.error
    if(!verifyOnly && label!=='C') {
      let a=history.data[0] as Attempt|undefined
      if(!a) a=await act('start')
      if(a.scene===1) a=await act('research',a,'Inspect brand, distribution and cash flow.')
      if(a.scene===2) a=await act('buy_40',a,'Respect the 40% position cap.')
      if(label==='B') {
        if(a.scene===3) a=await act('hold_rules',a,'No exit condition was triggered in this teaching scenario.')
        if(a.status!=='completed') a=await act('review',a,'Reassess if long-term cash flow or competitiveness deteriorates. One outcome is insufficient evidence.')
      }
      u.attempt=a.id; await save()
      if(label==='A' && !u.conversation) {
        const chats=await db.from('conversations').select('id').limit(1)
        if(chats.error) throw chats.error
        if(chats.data[0]) u.conversation=chats.data[0].id
        else {
          const requestId=randomUUID()
          const chat=await db.rpc('begin_chat',{p_conversation_id:null,p_question:'Teaching demo: why recheck the exit conditions at scene 03?',p_request_id:requestId})
          if(chat.error) throw chat.error
          u.conversation=chat.data
          const message=await db.from('messages').update({status:'failed',content:'[Demo preparation: no model was called. Ask the Agent to continue.]'}).eq('id',requestId)
          if(message.error) throw message.error
        }
        await save()
      }
    }
    await db.auth.signOut()
    const fresh=client()
    const login=await fresh.auth.signInWithPassword({email:u.email,password:u.password})
    if(login.error) throw login.error
    history=await fresh.from('learning_attempts').select('*').order('started_at',{ascending:false})
    if(history.error) throw history.error
    if(label==='A') { assert.equal(history.data[0].scene,3); assert.equal(history.data[0].total_cents,918000) }
    if(label==='B') { assert.equal(history.data[0].status,'completed'); assert.equal(history.data[0].total_cents,1376000) }
    if(label==='C') {
      assert.equal(history.data.length,0)
      const progress=await fresh.from('learning_progress').select('user_id')
      if(progress.error) throw progress.error
      assert.deepEqual(progress.data,[])
    }
    const access=await fresh.from('learning_content').select('course_id').eq('course_id','value-internal')
    if(access.error) throw access.error
    if(label!=='B' || verifyOnly) assert.equal(access.data.length,label==='B'?1:0)
    if(label!=='A') {
      const other=await fresh.from('learning_attempts').select('*').eq('id',users.A.attempt!)
      assert.deepEqual(other.data,[])
      const messages=await fresh.from('messages').select('id').eq('conversation_id',users.A.conversation!)
      assert.deepEqual(messages.data,[])
      const hijack=await fresh.rpc('learning_act',{p_operation_id:randomUUID(),p_course_id:'coca-cola',p_attempt_id:users.A.attempt,p_revision:2,p_action:'sell_fear',p_reason:''})
      assert.match(hijack.error?.message ?? '',/Attempt not found/)
    }
    if(label==='A') { const chats=await fresh.from('messages').select('id').eq('conversation_id',u.conversation!); assert.ok(chats.data?.length) }
    const forge=await fresh.from('course_entitlements').upsert({user_id:u.id,package_id:'forbidden-test',source:'demo'})
    assert.equal(forge.error?.code,'42501','Learner must not grant access')
    const balance=await fresh.from('learning_attempts').update({cash_cents:9999999}).eq('user_id',u.id)
    assert.equal(balance.error?.code,'42501','Learner must not directly modify balances')
    const privateView=await fresh.schema('learning_private').from('mentor_summary').select('*')
    assert.equal(privateView.error?.code,'PGRST106','Mentor schema must not be exposed through REST')
    if(label==='A') {
      const choice=await fresh.from('learning_choices').select('*').eq('attempt_id',u.attempt!).eq('action','buy_40').single()
      if(choice.error) throw choice.error
      const replay=await fresh.rpc('learning_act',{p_operation_id:choice.data.id,p_course_id:'coca-cola',p_attempt_id:u.attempt,p_revision:1,p_action:'buy_40',p_reason:choice.data.reason})
      if(replay.error) throw replay.error
      assert.equal(replay.data.total_cents,918000); assert.equal(replay.data.shares,40)
      const duplicate=await fresh.rpc('learning_act',{p_operation_id:randomUUID(),p_course_id:'coca-cola',p_attempt_id:u.attempt,p_revision:1,p_action:'buy_40',p_reason:''})
      assert.match(duplicate.error?.message ?? '',/Stale attempt/)
    }
    verified[label]={userId:u.id,normalAuth:true,freshLoginRestore:true,attempts:history.data.length,restrictedContentAccessible:access.data.length>0,entitlementMutation:'42501',balanceMutation:'42501',mentorSchema:'PGRST106'}
    await fresh.auth.signOut()
    console.log(label, 'normal signup/login and saved-state checks passed; user ID:',u.id)
  }
  if(verifyOnly) {
    await mkdir('docs/collab/learning-live-validation',{recursive:true})
    await writeFile('docs/collab/learning-live-validation/auth-rest-result.json',JSON.stringify({environment:url,checkedAt:new Date().toISOString(),accounts:verified},null,2))
  }
  if(!verifyOnly) console.log('Credentials are in the ignored local fixture. On the confirmed TEST DB only, enable learning_private.environment.allow_demo and call learning_private.grant_demo for B:',users.B.id,'Then rerun with --verify. No payment or model call was made.')
}
main().catch(error=>{ console.error(error.message); process.exitCode=1 })
