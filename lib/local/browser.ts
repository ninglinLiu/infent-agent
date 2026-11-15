'use client'
import type { SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { accountTransport } from '@/lib/account/fetch'
type Listener = (event: AuthChangeEvent, session: Session | null) => void
const listeners = new Set<Listener>()
const notify = (event: AuthChangeEvent, session: Session | null) => listeners.forEach(fn => fn(event,session))
async function action(body: object) {
  const r=await accountTransport('/api/local/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  const result=await r.json()
  if (!result.error && result.data?.session) notify('SIGNED_IN',result.data.session)
  return result
}
const client = { auth: {
  getUser: async () => {
    const r=await accountTransport('/api/local/auth',{cache:'no-store'})
    return await r.json() as {data:{user:User|null};error:unknown}
  },
  signUp: (v:{email:string;password:string;options?:{data?:{display_name?:string}}}) => action({action:'register',email:v.email,password:v.password,name:v.options?.data?.display_name}),
  signInWithPassword: (v:{email:string;password:string}) => action({action:'login',...v}),
  signOut: async () => { const r=await action({action:'logout'}); if(!r.error) notify('SIGNED_OUT',null); return r },
  updateUser: async () => ({data:{user:null},error:{message:'Create a new local demo account for password recovery.'}}),
  onAuthStateChange: (fn:Listener) => { listeners.add(fn); return {data:{subscription:{unsubscribe:()=>listeners.delete(fn)}}} },
} } as unknown as SupabaseClient
export function localBrowser() { return client }
