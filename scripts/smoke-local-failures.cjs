const http=require('node:http'),assert=require('node:assert/strict')
const base=process.env.DEMO_TEST_URL||'http://localhost:3199'
async function main(){
 let kind='busy',hits=0
 const provider=http.createServer((req,res)=>{hits++;req.resume();if(kind==='busy'){res.writeHead(503);res.end('fixture overloaded')}else{res.writeHead(200,{'Content-Type':'text/event-stream'});res.flushHeaders();res.write(': fixture stalled\n\n')}})
 await new Promise(r=>provider.listen(3201,'127.0.0.1',r))
 let cookie=''
 const post=async(url,data)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',origin:base,cookie},body:JSON.stringify(data)})
 try {
  const r=await post('/api/local/auth',{action:'register',email:`failure-${Date.now()}@example.invalid`,password:'Demo-failure-123',name:'故障验收'})
  assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0]
  assert.equal((await post('/api/local/status',{mode:'online'})).status,200)
  const chat=async()=>{const r=await post('/api/chat',{messages:[{role:'user',content:'帮我配置一个科技策略'}]});assert.equal(r.status,200);const text=await r.text();return JSON.parse(text.split('\n<<<INFENT_META>>>')[1])}
  let meta=await chat();assert.equal(meta.errorCode,'MODEL_HTTP');assert.equal(hits,2)
  kind='stall';hits=0
  const start=Date.now();meta=await chat();assert.equal(meta.errorCode,'MODEL_TIMEOUT');assert.ok(Date.now()-start<32000)
  assert.equal((await post('/api/local/status',{mode:'offline'})).status,200)
  meta=await chat();assert.equal(meta.demo,true);assert.equal(meta.tools[0].result.ok,true)
  console.log('PASS: provider 503 retries exactly once; stalled SSE ends within 32s; switch offline produces a valid strategy immediately.')
 }finally{await post('/api/local/status',{mode:'offline'}).catch(()=>{});provider.closeAllConnections();await new Promise(r=>provider.close(r))}
}
main().catch(e=>{console.error(e);process.exitCode=1})
