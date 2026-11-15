import { NextRequest, NextResponse } from 'next/server'
import { localDemoEnabled, localOffline } from '@/lib/local/config'
import { localDatabase } from '@/lib/local/database'
import { requireLocalOrigin } from '@/lib/local/auth'
import { getChatConfig } from '@/lib/ai/config'
import { SNAPSHOT_END, LOCAL_SYMBOLS } from '@/lib/local/market'
import { readBody } from '@/lib/account/server'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest) {
  if(!localDemoEnabled()) return new Response(null,{status:404})
  try {
    requireLocalOrigin(req)
    await (await localDatabase()).query('select 1')
    return NextResponse.json({ready:true,mode:localOffline()?'offline':'online',modelConfigured:!!getChatConfig(),snapshotEnd:SNAPSHOT_END,symbols:LOCAL_SYMBOLS},{headers:{'Cache-Control':'no-store'}})
  } catch { return NextResponse.json({ready:false,error:'Local database initialization failed. Check launcher logs.'},{status:503}) }
}
export async function POST(req:NextRequest) {
  if(!localDemoEnabled()) return new Response(null,{status:404})
  try {
    requireLocalOrigin(req)
    const body=await readBody(req) as {mode?:string}
    if(!['online','offline'].includes(body.mode||'')) return new Response(null,{status:400})
    if(body.mode==='online'&&!getChatConfig()) return NextResponse.json({error:'请先在本机 .env.local 配置 DEEPSEEK_API_KEY，然后重启 / Configure a server-side key and restart.'},{status:400})
    process.env.OMNIAI_MODEL_MODE=body.mode
    return GET(req)
  } catch { return new Response(null,{status:400}) }
}
