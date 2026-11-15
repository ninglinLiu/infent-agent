const {spawnSync}=require('node:child_process')
const env={...process.env,NEXT_PUBLIC_LOCAL_DEMO:'1',OMNIAI_LOCAL_DEMO:'1',OMNIAI_MODEL_MODE:'offline',NEXT_TELEMETRY_DISABLED:'1'}
for(const key of Object.keys(env)) if(/SUPABASE|API_KEY|VERCEL|EMBEDDING/.test(key)) delete env[key]
for(const args of [['scripts/build-knowledge.mjs'],['node_modules/next/dist/bin/next','build']]){
  const r=spawnSync(process.execPath,args,{env,stdio:'inherit'})
  if(r.status!==0) process.exit(r.status||1)
}
