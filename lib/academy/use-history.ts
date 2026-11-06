'use client'

import { useEffect, useState } from 'react'

const cache = new Map<string, Promise<unknown>>()

/** 读取 public/data/history 下的静态行情，同一文件只请求一次。 */
export function useHistoryFile<T>(name: string | null, validate?: (raw: unknown, name: string) => T) {
  const [state, setState] = useState<{ name: string | null; data: T | null; failed: boolean }>({ name: null, data: null, failed: false })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!name) return
    let active = true
    setState({ name, data: null, failed: false })
    let job = cache.get(name)
    if (!job) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 12000)
      job = fetch(`/data/history/${name}.json`, { signal: controller.signal })
        .then(res => { if (!res.ok) throw new Error(String(res.status)); return res.json() as Promise<unknown> })
        .finally(() => clearTimeout(timer))
      cache.set(name, job)
    }
    job.then(raw => validate ? validate(raw, name) : raw as T)
      .then(data => { if (active) setState({ name, data, failed: false }) })
      .catch(() => {
        if (cache.get(name) === job) cache.delete(name)
        if (active) setState({ name, data: null, failed: true })
      })
    return () => { active = false }
  }, [name, attempt, validate])
  const current = state.name === name
  return { data: current ? state.data : null, failed: current && state.failed, retry: () => {
    if (name) cache.delete(name)
    setState({ name, data: null, failed: false })
    setAttempt(n => n + 1)
  } }
}
