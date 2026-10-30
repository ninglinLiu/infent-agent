'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAccount } from '@/components/account/AccountProvider'
import { accountFetch } from '@/lib/account/browser'
import type { Attempt, ChoiceEvent, CourseContent, LearningAction, LearningData } from '@/lib/account/learning'

type Detail = { attempt: Attempt; content: CourseContent; choices: ChoiceEvent[] }
type ContextValue = { data: LearningData; detail: Detail | null; ready: boolean; busy: boolean; error: string; saved: boolean; pending: boolean; reload: () => Promise<boolean>; select: (id: string) => Promise<void>; act: (action: LearningAction['action'], reason?: string, courseId?: string) => Promise<void>; retry: () => Promise<void> }
const Context = createContext<ContextValue | null>(null)
const empty: LearningData = { courses: [], attempts: [], entitlements: [] }
export function LearningProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAccount()
  const [data, setData] = useState<LearningData>(empty)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)
  const operation = useRef<LearningAction | null>(null)
  const locked = useRef(false)
  const active = useRef(true)
  const selection = useRef(0)
  const selectedId = useRef<string | null>(null)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const reload = useCallback(async () => {
    if (!user) return false
    try {
      const result = await accountFetch<LearningData>('/api/learning')
      if (active.current) { setData(result); setReady(true); setError('') }
      return active.current
    } catch (e) { if (active.current) setError((e as Error).message); return false }
  }, [user])
  useEffect(() => { void reload() }, [reload])
  const select = useCallback(async (id: string) => {
    selectedId.current = id
    const ticket = ++selection.current
    setError(''); setDetail(null)
    try {
      const result = await accountFetch<Detail>(`/api/learning?attempt=${encodeURIComponent(id)}`)
      if (active.current && ticket === selection.current) setDetail(result)
    } catch (e) { if (active.current && ticket === selection.current) setError((e as Error).message) }
  }, [])
  const submit = async (op: LearningAction) => {
    if (locked.current) return
    locked.current = true; setBusy(true); setSaved(false); setError(''); setPending(true)
    operation.current = op
    try {
      const result = await accountFetch<{ attempt: Attempt; saved: true }>('/api/learning', { method: 'POST', body: JSON.stringify(op) })
      if (!active.current) return
      operation.current = null; setPending(false); setSaved(true)
      selectedId.current = result.attempt.id
      if (await reload()) await select(result.attempt.id)
    } catch (e) {
      if (active.current) {
        if ((e as { status?: number }).status === 409) { operation.current = null; setPending(false) }
        setError((e as Error).message)
      }
    }
    finally { locked.current = false; if (active.current) setBusy(false) }
  }
  const act: ContextValue['act'] = async (action, reason = '', courseId = 'coca-cola') => {
    if (operation.current || locked.current) return
    const attempt = detail?.attempt
    await submit({ operationId: crypto.randomUUID(), action, reason, courseId: action === 'start' ? courseId : attempt?.course_id ?? courseId, attemptId: action === 'start' ? null : attempt?.id ?? null, revision: action === 'start' ? 0 : attempt?.revision ?? 0 })
  }
  const retry = async () => {
    if (operation.current) await submit(operation.current)
    else if (await reload()) { if (selectedId.current) await select(selectedId.current) }
  }
  return <Context.Provider value={{ data, detail, ready, busy, error, saved, pending, reload, select, act, retry }}>{children}</Context.Provider>
}
export function useLearning() { const value = useContext(Context); if (!value) throw new Error('LearningProvider required'); return value }
