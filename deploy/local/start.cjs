const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),{spawn,execFile}=require('node:child_process')
const root=__dirname
const envFile=path.join(root,'.env.local')
if(fs.existsSync(envFile)) process.loadEnvFile(envFile)
const env={...process.env,NODE_ENV:'production',HOSTNAME:'127.0.0.1',OMNIAI_LOCAL_DEMO:'1',NEXT_PUBLIC_LOCAL_DEMO:'1',OMNIAI_MODEL_MODE:process.env.OMNIAI_MODEL_MODE||'offline',OMNIAI_DATA_DIR:path.join(root,'local-data'),NEXT_TELEMETRY_DISABLED:'1'}
// This package never connects to production accounts. Stale VPN proxy settings
// must not redirect the optional direct DeepSeek connection.
for(const key of Object.keys(env)) if(/SUPABASE|VERCEL|^(HTTP_PROXY|HTTPS_PROXY|ALL_PROXY|http_proxy|https_proxy|all_proxy|NODE_USE_ENV_PROXY)$/.test(key)) delete env[key]
async function free(port){return new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(port,'127.0.0.1',()=>s.close(()=>resolve(true)))})}
async function main(){
  let port=Number(process.env.PORT)||3000
  while(!(await free(port))&&port<3010) port++
  if(port>=3010) throw new Error('Ports 3000-3009 are busy. Close another demo window.')
  env.PORT=String(port)
  const child=spawn(process.execPath,[path.join(root,'app/server.js')],{cwd:path.join(root,'app'),env,stdio:'inherit',windowsHide:true})
  process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill())
  child.on('exit',code=>process.exit(code||0))
  const url=`http://localhost:${port}`
  console.log('\nOmniAI local demo. Keep this window open. Close it to stop.\nData stays in: '+env.OMNIAI_DATA_DIR+'\n')
  for(let i=0;i<90;i++){
    await new Promise(r=>setTimeout(r,1000))
    try{const response=await fetch(url+'/api/local/status',{signal:AbortSignal.timeout(5000)});if(!response.ok)continue;const s=await response.json();if(!s.ready)continue
      console.log(`READY: ${url}/login\nMode: ${s.mode}. Historical snapshot ends ${s.snapshotEnd}.\n`)
      if(process.env.OMNIAI_NO_BROWSER!=='1'){
        if(process.platform==='win32')execFile('rundll32.exe',['url.dll,FileProtocolHandler',url+'/login'])
        else execFile(process.platform==='darwin'?'open':'xdg-open',[url+'/login'],()=>{})
      }
      return
    }catch{}
  }
  console.error('Startup did not pass readiness check. See errors above; do not use this laptop on stage until fixed.')
  child.kill();process.exitCode=1
}
main().catch(e=>{console.error(e.message);process.exitCode=1})
