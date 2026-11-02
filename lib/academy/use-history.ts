'use client'

import { useEffect, useState } from 'react'

const cache = new Map<string, Promise<unknown>>()

/** 读取 public/data/history 下的静态行情，同一文件只请求一次。 */
export function useHistoryFile<T>(name: string | null) {
  const [state, setState] = useState<{ name: string | null; data: T | null; failed: boolean }>({ name: null, data: null, failed: false })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!name) return
    let active = true
    let job = cache.get(name) as Promise<T> | undefined
    if (!job) {
      job = fetch(`/data/history/${name}.json`).then(res => { if (!res.ok) throw new Error(String(res.status)); return res.json() as Promise<T> })
      cache.set(name, job)
      job.catch(() => cache.delete(name))
    }
    job.then(data => { if (active) setState({ name, data, failed: false }) }, () => { if (active) setState({ name, data: null, failed: true }) })
    return () => { active = false }
  }, [name, attempt])
  const current = state.name === name
  return { data: current ? state.data : null, failed: current && state.failed, retry: () => setAttempt(n => n + 1) }
}
