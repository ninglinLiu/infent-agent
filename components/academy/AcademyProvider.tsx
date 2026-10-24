"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { EMPTY_ACADEMY, readAcademy, type AcademyState } from '@/lib/academy'
import { useAccount } from '@/components/account/AccountProvider'
import { accountFetch, browserAccount } from '@/lib/account/browser'
import { useLang } from '@/lib/i18n'

type AcademyContext = { state: AcademyState; ready: boolean; storageAvailable: boolean; update: (patch: Partial<AcademyState>) => void; logout: () => void }
const Context = createContext<AcademyContext | null>(null)

export function AcademyProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: accountReady } = useAccount()
  const userId = user?.id
  const { lang } = useLang()
  const [state, setState] = useState<AcademyState>(EMPTY_ACADEMY)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading')
  const pending = useRef<Partial<AcademyState>>({})
  const sending = useRef(false)
  const active = useRef(true)
  const version = useRef(0)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const load = useCallback(async () => {
    if (!userId) { setState(EMPTY_ACADEMY); setReady(accountReady); return }
    setStatus('loading')
    try {
      const result = await accountFetch<{ state: AcademyState }>('/api/progress')
      if (active.current) { setState(readAcademy(JSON.stringify(result.state))); setReady(true); setStatus('saved') }
    } catch { if (active.current) { setReady(false); setStatus('error') } }
  }, [userId, accountReady])
  useEffect(() => { void load() }, [load])
  const flush = useCallback(async () => {
    if (sending.current || !userId || !ready) return
    sending.current = true
    while (active.current && Object.keys(pending.current).length) {
      const patch = pending.current
      const sentVersion = version.current
      pending.current = {}
      setStatus('saving')
      try {
        const result = await accountFetch<{ state: AcademyState }>('/api/progress', { method: 'PATCH', body: JSON.stringify(patch) })
        if (active.current) {
          if (version.current === sentVersion) setState(readAcademy(JSON.stringify(result.state)))
          setStatus('saved')
        }
      } catch {
        pending.current = { ...patch, ...pending.current }
        if (active.current) setStatus('error')
        break
      }
    }
    sending.current = false
  }, [userId, ready])
  const update = useCallback((patch: Partial<AcademyState>) => {
    if (!userId || !ready) return
    version.current++
    setState(previous => ({ ...previous, ...patch }))
    pending.current = { ...pending.current, ...patch }
    void flush()
  }, [userId, ready, flush])
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (sending.current || Object.keys(pending.current).length) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])
  const logout = async () => {
    await flush()
    if (sending.current || Object.keys(pending.current).length) return
    const result = await browserAccount()?.auth.signOut()
    if (result?.error) { setStatus('error'); return }
    location.assign('/login')
  }
  return <Context.Provider value={{ state, ready, storageAvailable: status !== 'error', update, logout: () => void logout() }}>
    {user && (status === 'saving' || status === 'error') && <div className="account-sync" role="status">{status === 'saving' ? (lang === 'en' ? 'Saving progress…' : '正在保存学习进度…') : (lang === 'en' ? 'Cloud sync failed. Your changes are not saved yet.' : '云端同步失败，当前更改尚未保存。')}{status === 'error' && <button onClick={() => void (ready ? flush() : load())}>{lang === 'en' ? 'Retry' : '重试'}</button>}</div>}
    {children}
  </Context.Provider>
}

export function useAcademy() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('AcademyProvider is required')
  return ctx
}
