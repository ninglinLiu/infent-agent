import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { localDatabase, localClient } from './database'
const scrypt = promisify(scryptCallback)
const COOKIE = 'omniai-local-session'
const digest = (v: string) => createHash('sha256').update(v).digest('hex')
export function requireLocalOrigin(req: NextRequest) {
  if (!['localhost','127.0.0.1','[::1]'].includes(req.nextUrl.hostname)) throw new Error('Local demo accepts localhost only')
  if (req.headers.get('origin') && req.headers.get('origin') !== req.nextUrl.origin) throw new Error('Cross-origin request rejected')
}
async function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${(await scrypt(password, salt, 64) as Buffer).toString('hex')}`
}
export async function localUser(req: NextRequest): Promise<User | null> {
  requireLocalOrigin(req)
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  const db = await localDatabase()
  const rows = await db.query<{ user: User }>(`select json_build_object('id',u.id,'email',u.email,'created_at',u.created_at,
    'last_sign_in_at',u.last_sign_in_at,'email_confirmed_at',null,'user_metadata',u.raw_user_meta_data,'app_metadata','{}'::jsonb,'aud','authenticated') as "user"
    from auth.users u join auth.local_sessions s on s.user_id=u.id where s.token_hash=$1 and s.expires_at>now()`, [digest(token)])
  return rows.rows[0]?.user ?? null
}
export async function localAccount(req: NextRequest) {
  const user = await localUser(req)
  if (!user) return null
  return { user, db: localClient(user.id), finish: (response: Response) => {
    const r = new NextResponse(response.body, response); r.headers.set('Cache-Control','private, no-store'); r.headers.set('Vary','Cookie'); return r
  } }
}
export async function localSignIn(req: NextRequest, input: { action: string; email?: string; password?: string; name?: string }) {
  requireLocalOrigin(req)
  const db = await localDatabase()
  const response = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control':'no-store' } })
  if (input.action === 'logout') {
    const token = req.cookies.get(COOKIE)?.value
    if (token) await db.query('delete from auth.local_sessions where token_hash=$1', [digest(token)])
    const r = response({ data: {}, error: null }); r.cookies.set(COOKIE,'',{ path:'/',maxAge:0,httpOnly:true,sameSite:'strict' }); return r
  }
  const email = input.email?.trim().toLowerCase() || ''
  const password = input.password || ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || password.length>128 || password.length < (input.action==='register'?10:1)) return response({ error: { message:'Invalid email or password',code:'invalid_credentials' } },400)
  let id: string
  if (input.action === 'register') {
    id = randomUUID()
    try { await db.query('insert into auth.users(id,email,password_hash,raw_user_meta_data) values($1,$2,$3,$4)',[id,email,await hashPassword(password),JSON.stringify({display_name:(input.name||'').slice(0,20)})]) }
    catch (e) { if ((e as {code?:string}).code==='23505') return response({error:{message:'Email already registered',code:'email_exists'}},409); throw e }
  } else {
    const row = (await db.query<{id:string;password_hash:string}>('select id,password_hash from auth.users where email=$1',[email])).rows[0]
    const hashed = await hashPassword(password,row?.password_hash.split(':')[0] || 'unknown-user')
    if (!row || !timingSafeEqual(Buffer.from(hashed.split(':')[1],'hex'),Buffer.from(row.password_hash.split(':')[1],'hex'))) return response({error:{message:'Incorrect email or password',code:'invalid_credentials'}},401)
    id=row.id
  }
  const token=randomBytes(32).toString('base64url')
  await db.query("insert into auth.local_sessions values($1,$2,now()+interval '7 days')",[digest(token),id])
  await db.query('update auth.users set last_sign_in_at=now() where id=$1',[id])
  const r=response({data:{session:{user:{id,email}},user:{id,email}},error:null})
  r.cookies.set(COOKIE,token,{httpOnly:true,sameSite:'strict',path:'/',maxAge:604800})
  return r
}
