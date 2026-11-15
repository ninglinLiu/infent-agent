const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn,spawnSync,execFileSync}=require('node:child_process')
const root=process.env.DEMO_BUNDLE
if(!root) throw new Error('Set DEMO_BUNDLE to a freshly extracted portable package')
const base='http://localhost:3005'
const env={...process.env,PORT:'3005',OMNIAI_NO_BROWSER:'1',OMNIAI_MODEL_MODE:'offline',LLM_API_KEY:'fixture-not-a-real-key',LLM_BASE_URL:'http://127.0.0.1:3201/v1',DEMO_TEST_URL:base}
let child
async function boot(){
 child=spawn(path.join(root,'runtime/win-x64/node.exe'),[path.join(root,'start.cjs')],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']})
 const log=fs.createWriteStream('test-results/local-demo/portable-launcher.log',{flags:'a'});child.stdout.pipe(log);child.stderr.pipe(log)
 for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,1000));try{const r=await fetch(base+'/api/local/status',{signal:AbortSignal.timeout(3000)});if(r.ok&&(await r.json()).ready)return}catch{}}
 throw new Error('Portable launcher did not become ready')
}
function stop(){if(child&&!child.killed){try{execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'})}catch{}child=undefined}}
async function main(){
 fs.mkdirSync('test-results/local-demo',{recursive:true})
 try {
  await boot()
  for(const script of ['smoke-local-browser.cjs','smoke-local-failures.cjs']){
   const r=spawnSync(process.execPath,[path.join(__dirname,script)],{env,stdio:'inherit'});assert.equal(r.status,0,script)
  }
  const session=JSON.parse(fs.readFileSync('test-results/local-demo/session.json','utf8'))
  const cookie=session.cookies.map(c=>`${c.name}=${c.value}`).join('; ')
  const read=async url=>{const r=await fetch(base+url,{headers:{cookie}});assert.equal(r.status,200);return r.json()}
  const before=await read('/api/sandbox')
  stop();await new Promise(r=>setTimeout(r,1200));await boot()
  const after=await read('/api/sandbox')
  assert.deepEqual(after.positions,before.positions);assert.equal(after.cash,before.cash)
  const history=await read('/api/conversations');assert.equal(history.conversations.length,1)
  const messages=await read('/api/conversations?id='+history.conversations[0].id);assert.equal(messages.messages.length,6)
  console.log('PASS PORTABLE: extracted package + bundled Windows runtime; real browser flow, fault injection, restart with retained login/history/portfolio.')
 }finally{stop()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
