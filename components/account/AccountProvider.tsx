'use client'

import { createContext, Fragment, useContext, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { browserAccount } from '@/lib/account/browser'

const Context = createContext<{ user: User | null; ready: boolean; configured: boolean }>({ user: null, ready: false, configured: false })
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const identity = useRef<string | null>(null)
  const client = browserAccount()
  useEffect(() => {
    if (!client) { setReady(true); return }
    let active = true
    let generation = 0
    const verify = async () => {
      const current = ++generation
      try {
        const { data: { user: verified } } = await client.auth.getUser()
        if (active && current === generation) { identity.current = verified?.id ?? null; setUser(verified); setReady(true) }
      } catch { if (active && current === generation) { setUser(null); setReady(true) } }
    }
    void verify()
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { generation++; identity.current = null; setUser(null); setReady(true) }
      else {
        if (identity.current !== (session?.user.id ?? null)) { generation++; setUser(null); setReady(false) }
        setTimeout(() => { if (active) void verify() }, 0)
      }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [client])
  return <Context.Provider value={{ user, ready, configured: !!client }}><Fragment key={user?.id ?? 'guest'}>{children}</Fragment></Context.Provider>
}
export const useAccount = () => useContext(Context)
