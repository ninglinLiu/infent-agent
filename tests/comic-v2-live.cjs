// Opt-in isolated real auth + Next routes + PostgREST. No mocks or paid model calls.
const {chromium,expect}=require('@playwright/test'),fs=require('fs'),assert=require('assert/strict');
const config=JSON.parse(fs.readFileSync('.env.staging.public.local','utf8')),accounts=JSON.parse(fs.readFileSync('.learning-live-accounts.json','utf8'));
assert.equal(config.projectId,'sscjolfuydqmskqzfppn');assert.equal(accounts.url,config.url);
const out='docs/collab/comic-v2';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge'});const report={project:config.projectId,mockedRequests:0,errors:[],paths:[]};const contexts=[];
async function login(user){const c=await browser.newContext({viewport:{width:1440,height:1300}});contexts.push(c);const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://localhost:3110/login');await p.getByRole('button',{name:'English',exact:true}).click();await p.getByLabel('Email',{exact:true}).fill(user.email);await p.locator('input[type=password]').fill(user.password);await p.getByRole('button',{name:'Sign in',exact:true}).click();await p.waitForURL('**/dashboard');await p.locator('.night-study[data-scene-ready=true]').waitFor({timeout:60000});return{p,c}}
async function enter(p){await p.locator('.night-entry-card--academy').click();for(let i=0;i<5 && !(await p.getByRole('button',{name:'Practice',exact:true}).count());i++){await p.locator('.academy-primary').last().click();await p.waitForTimeout(1200)}await p.getByRole('button',{name:'Practice',exact:true}).click();await p.locator('.comic-simulation').waitFor()}
async function data(p,id){const r=await p.request.get('http://localhost:3110/api/learning'+(id?'?attempt='+id:''));assert.equal(r.status(),200);return r.json()}
async function choose(p,action){const btn=p.locator('[data-choice='+action+']');await expect(btn).toBeEnabled({timeout:30000});await btn.click();await expect(p.getByText('Saving…',{exact:true})).toHaveCount(0,{timeout:30000});await expect(p.getByText('Saved to your account',{exact:true})).toBeVisible({timeout:30000})}
try{
 for(const [name,path] of [['A',['research','buy_40','hold_rules','keep_position']],['C',['wait_quarter','reserve_cash','enter_pullback','exit_position']]]){
  const {p,c}=await login(accounts.users[name]);const original=await data(p);const legacy=original.attempts.filter(x=>x.script_version==='v1');await enter(p);await p.waitForTimeout(2500);
  const upgrade=p.getByRole('button',{name:'Open the new four-decision case (keep this record)',exact:true});
  if(await upgrade.count())await upgrade.click();else if(await p.getByRole('button',{name:'Start learning',exact:true}).count())await p.getByRole('button',{name:'Start learning',exact:true}).click();
  if(await p.locator('.comic-simulation[data-status=completed]').count())await p.getByRole('button',{name:'Reset simulation',exact:true}).click();await expect(p.locator('[data-choice=wait_quarter]')).toBeVisible({timeout:30000});
  for(let i=0;i<path.length;i++){
   if(i===3)await p.getByLabel('Review',{exact:true}).fill('I will review demand, cash flow and my capital needs before changing exposure.');
   await choose(p,path[i]);const current=(await data(p)).attempts.find(x=>x.script_version==='v2');assert.ok(current);const detail=await data(p,current.id);assert.equal(detail.choices.length,i+1);assert.equal(detail.choices[i].action,path[i]);
   if(i===1){await p.reload();await p.locator('.night-entry-card--academy').click();await p.getByRole('button',{name:'Practice',exact:true}).click();const restored=await data(p,current.id);assert.deepEqual(restored.attempt,detail.attempt)}
  }
  await expect(p.getByRole('dialog')).toBeVisible();await p.getByRole('button',{name:'Keep this review',exact:true}).click();await expect(p.getByRole('region',{name:'Your outcome'})).toBeVisible();
  await p.locator('.academy-main').evaluate(e=>e.scrollTo(0,0));await p.screenshot({path:out+'/'+name+'-completed-en.png',fullPage:true});
  const final=(await data(p)).attempts.find(x=>x.script_version==='v2');assert.equal(final.status,'completed');assert.ok(final.completed_at);assert.equal(final.total_cents,name==='A'?1376000:1458000);
  for(const old of legacy)assert.deepEqual((await data(p,old.id)).attempt,old);
  report.paths.push({account:name,attempt:final.id,actions:path,totalCents:final.total_cents,status:final.status,completedAt:final.completed_at,legacyRecordsUnchanged:legacy.length});
  await c.close();const again=await login(accounts.users[name]);const restored=await data(again.p,final.id);assert.equal(restored.attempt.status,'completed');assert.equal(restored.choices.length,4);
  const foreign=report.paths.find(x=>x.account!==name);if(foreign)assert.equal((await again.p.request.get('http://localhost:3110/api/learning?attempt='+foreign.attempt)).status(),404);
  await again.p.goto('http://localhost:3110/account');await again.p.getByRole('button',{name:'Sign out',exact:true}).click();await again.p.waitForURL('**/login');assert.equal((await again.p.request.get('http://localhost:3110/api/learning')).status(),401);await again.c.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{fs.writeFileSync(out+'/real-auth.json',JSON.stringify(report,null,2));for(const c of contexts)await c.close();await browser.close()}console.log(JSON.stringify(report))})().catch(e=>{console.error(e.message);process.exit(1)});

