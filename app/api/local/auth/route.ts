import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { localDemoEnabled } from '@/lib/local/config'
import { localSignIn, localUser } from '@/lib/local/auth'
import { readBody } from '@/lib/account/server'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const body=z.object({action:z.enum(['register','login','logout']),email:z.string().max(254).optional(),password:z.string().max(128).optional(),name:z.string().max(20).optional()}).strict()
export async function GET(req:NextRequest) {
  if(!localDemoEnabled()) return new Response(null,{status:404})
  try { return NextResponse.json({data:{user:await localUser(req)},error:null},{headers:{'Cache-Control':'no-store'}}) }
  catch { return NextResponse.json({data:{user:null},error:{message:'Local account unavailable'}},{status:503}) }
}
export async function POST(req:NextRequest) {
  if(!localDemoEnabled()) return new Response(null,{status:404})
  try { return await localSignIn(req,body.parse(await readBody(req))) }
  catch { return NextResponse.json({data:{session:null},error:{message:'Local account unavailable. Check the launcher log.'}},{status:400}) }
}
