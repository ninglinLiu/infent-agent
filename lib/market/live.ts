'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { LiveQuote } from './quotes'
import type { OracleReading } from './chainlink'

/**
 * 全页面共用一个行情轮询：无论多少组件订阅，只有一个 5 秒定时器，
 * 标签页不可见时暂停。请求命中同一个 CDN 缓存键，服务端调用次数与访客数无关。
 */

export type Tick = { price: number; at: number }
export type LiveState = {
  quotes: Record<string, LiveQuote>
  /** 本页打开以来每次刷新到的价格，用于跳动方向与逐笔走势 */
  ticks: Record<string, Tick[]>
  /** 最近一次价格变化的方向与时间，用于闪烁 */
  flashes: Record<string, { dir: 1 | -1; at: number }>
  oracle: Record<string, OracleReading>
  status: 'idle' | 'live' | 'stale' | 'error'
  updatedAt: number | null
}

const QUOTE_MS = 5_000
const ORACLE_MS = 60_000
let state: LiveState = { quotes: {}, ticks: {}, flashes: {}, oracle: {}, status: 'idle', updatedAt: null }
const listeners = new Set<() => void>()
let subscribers = 0
let quoteTimer: ReturnType<typeof setTimeout> | null = null
let oracleTimer: ReturnType<typeof setTimeout> | null = null
let failures = 0

function emit(next: Partial<LiveState>) {
  state = { ...state, ...next }
  listeners.forEach(listener => listener())
}

function visible() {
  return typeof document === 'undefined' || document.visibilityState === 'visible'
}

async function pullQuotes() {
  if (!visible()) return
  try {
    const res = await fetch('/api/market/quotes', { cache: 'no-store' })
    if (!res.ok) throw new Error(String(res.status))
    const { quotes } = await res.json() as { quotes: LiveQuote[] }
    const now = Date.now()
    const nextQuotes = { ...state.quotes }, ticks = { ...state.ticks }, flashes = { ...state.flashes }
    for (const quote of quotes) {
      const before = state.quotes[quote.symbol]
      if (before && before.price !== quote.price) flashes[quote.symbol] = { dir: quote.price > before.price ? 1 : -1, at: now }
      const series = ticks[quote.symbol] ?? []
      if (!series.length || series[series.length - 1].price !== quote.price) ticks[quote.symbol] = [...series, { price: quote.price, at: now }].slice(-240)
      nextQuotes[quote.symbol] = quote
    }
    failures = 0
    emit({ quotes: nextQuotes, ticks, flashes, status: 'live', updatedAt: now })
  } catch {
    failures++
    emit({ status: Object.keys(state.quotes).length ? 'stale' : 'error' })
  }
}

let oracleFailed = false
async function pullOracle() {
  if (!visible()) return
  try {
    const res = await fetch('/api/market/oracle', { cache: 'no-store' })
    if (!res.ok) throw new Error(String(res.status))
    const { readings } = await res.json() as { readings: OracleReading[] }
    oracleFailed = false
    emit({ oracle: Object.fromEntries(readings.map(r => [r.symbol, r])) })
  } catch { oracleFailed = true /* 预言机只是校验锚，失败时很快重试一次，不影响行情 */ }
}

function loopQuotes() {
  void pullQuotes().finally(() => {
    // 连续失败时退避，避免对上游造成压力
    if (subscribers) quoteTimer = setTimeout(loopQuotes, QUOTE_MS * Math.min(6, Math.max(1, failures)))
  })
}
function loopOracle() {
  void pullOracle().finally(() => { if (subscribers) oracleTimer = setTimeout(loopOracle, oracleFailed ? QUOTE_MS * 2 : ORACLE_MS) })
}
function onVisibility() {
  if (visible() && subscribers) { if (quoteTimer) clearTimeout(quoteTimer); loopQuotes() }
}

function start() {
  if (subscribers++ > 0) return
  loopQuotes()
  loopOracle()
  document.addEventListener('visibilitychange', onVisibility)
}
function stop() {
  if (--subscribers > 0) return
  if (quoteTimer) clearTimeout(quoteTimer)
  if (oracleTimer) clearTimeout(oracleTimer)
  quoteTimer = oracleTimer = null
  document.removeEventListener('visibilitychange', onVisibility)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
const getSnapshot = () => state
const serverSnapshot: LiveState = { quotes: {}, ticks: {}, flashes: {}, oracle: {}, status: 'idle', updatedAt: null }

/** 订阅实时行情；组件挂载期间保持轮询。 */
export function useLiveMarket(): LiveState {
  useEffect(() => { start(); return stop }, [])
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot)
}

/** 手动刷新（例如执行策略后立刻对一次价） */
export function refreshLiveMarket() {
  void pullQuotes()
}
