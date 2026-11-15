// Opt-in live model rehearsal against an isolated Supabase deployment only.
const {chromium}=require('@playwright/test')
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto')
const base=process.env.AGENT_STAGE_URL
const ref='sscjolfuydqmskqzfppn'
if(!base||!new URL(base).hostname.endsWith('.vercel.app'))throw Error('Explicit isolated candidate URL required')
async function main(){
 const browser=await chromium.launch({channel:'msedge',headless:true})
 const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 // Fail before any signup request if a production Auth URL appears.
 await context.route('**/auth/v1/**',r=>{assert.equal(new URL(r.request().url()).hostname,ref+'.supabase.co');return r.continue()})
 fs.mkdirSync('test-results/cloud-agent',{recursive:true})
 try{
  await page.goto(base+'/login')
  await page.getByRole('button',{name:'创建账号',exact:true}).click()
  await page.getByLabel('邮箱',{exact:true}).fill(`agent-release-${Date.now()}@example.com`)
  await page.getByLabel('昵称',{exact:true}).fill('Release rehearsal')
  await page.locator('input[autocomplete="new-password"]').fill(crypto.randomBytes(20).toString('base64url'))
  await page.getByRole('button',{name:'注册并登录',exact:true}).click()
  await page.waitForURL('**/dashboard',{timeout:60000})
  await page.goto(base+'/dashboard?enter=workspace')
  const input=page.locator('.agent-chat-composer input')
  await input.waitFor({state:'visible',timeout:30000})
  const results=[]
  for(const [i,q] of [
   '请调用 draft_strategy 生成一张 SPY 40%、QQQ 20%、现金40%的策略卡，基准SPY，初始资金100000美元。用于教学回测，请直接生成并简短说明。',
   '请再调用 draft_strategy 新生成一张降低回撤的策略卡：SPY 30%、QQQ 10%、现金60%，基准SPY，初始资金100000美元。简短说明即可。',
   '请再次调用 draft_strategy 新生成第三张策略卡：SPY 20%、QQQ 10%、GLD 20%、现金50%，基准SPY，初始资金100000美元。简短说明即可。'
  ].entries()){
   const responsePromise=page.waitForResponse(r=>r.url()===base+'/api/chat'&&r.request().method()==='POST',{timeout:130000})
   await input.fill(q);await input.press('Enter')
   const response=await responsePromise,raw=await response.text()
   assert.equal(response.status(),200)
   const meta=JSON.parse(raw.split('\n<<<INFENT_META>>>')[1]||'null')
   assert.ok(meta&&!meta.degraded&&!meta.persistenceFailed,JSON.stringify(meta))
   const drafts=meta.tools.filter(t=>t.name==='draft_strategy'&&t.result.ok)
   assert.ok(drafts.length,JSON.stringify(meta))
   await page.locator('.agent-chat .strategy-card').nth(i).waitFor({timeout:15000})
   await page.waitForFunction(()=>!document.querySelector('.agent-chat-composer input').disabled)
   results.push({turn:i+1,strategyId:drafts[0].result.data.strategyId,tools:meta.tools.map(t=>({name:t.name,ok:t.result.ok})),degraded:false})
   console.log('PASS genuine cloud strategy turn',i+1)
  }
  assert.equal(new Set(results.map(r=>r.strategyId)).size,3)
  await page.reload();await page.goto(base+'/dashboard?enter=workspace')
  await page.locator('.agent-chat .strategy-card').nth(2).waitFor({timeout:30000})
  assert.deepEqual(errors,[])
  await page.screenshot({path:'test-results/cloud-agent/staging-three-strategies.png',fullPage:true})
  fs.writeFileSync('test-results/cloud-agent/result.json',JSON.stringify({checkedAt:new Date().toISOString(),base,isolatedSupabase:ref,normalBrowserSignup:true,genuineModel:true,results,reloadRestored:true,pageErrors:errors},null,2))
  console.log('PASS normal browser signup + 3 distinct genuine model strategy cards + reload persistence, isolated staging only')
 }catch(e){await page.screenshot({path:'test-results/cloud-agent/failure.png',fullPage:true});throw e}finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
