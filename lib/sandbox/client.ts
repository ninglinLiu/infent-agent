'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { accountFetch } from '@/lib/account/browser'
import { accountTransport } from '@/lib/account/fetch'
import type { StrategySpec } from '@/lib/quant/strategy'
import { positionsFrom, STARTING_CASH } from './engine'
import type { ExecutionReport, SandboxOrderRow, SandboxPortfolio } from './types'

/**
 * 沙箱组合的前端 store。数据库迁移上线后读写 Supabase；
 * 未上线（API 返回 mode=local）时，同一套撮合结果记在本浏览器，界面行为一致。
 */

type Store = { portfolio: SandboxPortfolio | null; loading: boolean; error: string; userId: string | null }
let store: Store = { portfolio: null, loading: false, error: '', userId: null }
const listeners = new Set<() => void>()
const set = (next: Partial<Store>) => { store = { ...store, ...next }; listeners.forEach(l => l()) }

const key = (userId: string) => `omni.sandbox.v1.${userId}`
function readLocal(userId: string): SandboxPortfolio {
  try {
    const saved = JSON.parse(localStorage.getItem(key(userId)) ?? 'null') as SandboxPortfolio | null
    if (saved && Array.isArray(saved.orders)) return { ...saved, mode: 'local', positions: positionsFrom([...saved.orders].reverse()) }
  } catch { /* 存储不可用时从空账户开始 */ }
  return { mode: 'local', cash: STARTING_CASH, epoch: 1, positions: [], executions: [], orders: [] }
}
function writeLocal(userId: string, portfolio: SandboxPortfolio) {
  try { localStorage.setItem(key(userId), JSON.stringify({ ...portfolio, orders: portfolio.orders.slice(0, 200), executions: portfolio.executions.slice(0, 40) })) } catch { /* 忽略 */ }
}

export async function loadSandbox(userId: string) {
  set({ loading: true, error: '', userId, portfolio: store.userId === userId ? store.portfolio : null })
  try {
    const result = await accountFetch<SandboxPortfolio | { mode: 'local' }>('/api/sandbox')
    // 切换账号时丢弃上一个账号迟到的响应
    if (store.userId === userId) set({ portfolio: 'cash' in result ? result : readLocal(userId), loading: false })
  } catch (error) {
    if (store.userId === userId) set({ loading: false, error: (error as Error).message })
  }
}

function applyLocal(userId: string, report: ExecutionReport) {
  const current = readLocal(userId)
  const orders: SandboxOrderRow[] = report.plan.orders.map((o, i) => ({
    id: `${report.executionId}-${i}`, execution_id: report.executionId, symbol: o.symbol, side: o.side, qty: o.qty,
    quote_price: o.quotePrice, quoted_at: o.quotedAt, session: o.session, oracle_price: o.oraclePrice, oracle_updated_at: o.oracleUpdatedAt,
    oracle_round: o.oracleRound, slippage_bps: o.slippageBps, fill_price: o.fillPrice, fee: o.fee, notional: o.notional, created_at: report.at,
  }))
  const next: SandboxPortfolio = {
    ...current, cash: report.cash,
    orders: [...orders.reverse(), ...current.orders],
    executions: [{ id: report.executionId, kind: report.kind, strategy_ref: report.strategyRef, title: report.title, cash_before: report.plan.cashBefore, cash_after: report.cash, created_at: report.at }, ...current.executions],
    positions: [],
  }
  next.positions = positionsFrom([...next.orders].reverse())
  writeLocal(userId, next)
  return next
}

async function post(payload: Record<string, unknown>): Promise<ExecutionReport> {
  const response = await accountTransport('/api/sandbox', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  const result = await response.json()
  // 422 是风控拒单，带完整报告，界面要把失败原因演示出来
  if (!response.ok && response.status !== 422) throw Object.assign(new Error(result.error || 'Sandbox unavailable'), { status: response.status })
  return result as ExecutionReport
}

function localLedger() {
  const p = store.portfolio
  return p?.mode === 'local' ? { cash: p.cash, positions: p.positions } : undefined
}

export async function executeStrategy(spec: StrategySpec, backtest?: Record<string, unknown>) {
  const report = await post({ action: 'execute', operationId: crypto.randomUUID(), spec, backtest, local: localLedger() })
  afterExecution(report)
  return report
}

export async function closePosition(symbol: string) {
  const report = await post({ action: 'close', operationId: crypto.randomUUID(), symbol, local: localLedger() })
  afterExecution(report)
  return report
}

function afterExecution(report: ExecutionReport) {
  if (!report.plan.ok || !store.userId) return
  if (report.mode === 'local') set({ portfolio: applyLocal(store.userId, report) })
  else void loadSandbox(store.userId)
}

export async function resetSandbox() {
  if (!store.userId) return
  const result = await accountFetch<{ mode: 'db' | 'local' }>('/api/sandbox', { method: 'POST', body: JSON.stringify({ action: 'reset' }) })
  if (result.mode === 'local') { try { localStorage.removeItem(key(store.userId)) } catch { /* 忽略 */ } }
  await loadSandbox(store.userId)
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const empty: Store = { portfolio: null, loading: false, error: '', userId: null }

/** 订阅沙箱组合；传入登录用户 ID 时自动加载。 */
export function useSandbox(userId: string | null | undefined) {
  useEffect(() => { if (userId && (store.userId !== userId || !store.portfolio)) void loadSandbox(userId) }, [userId])
  const current = useSyncExternalStore(subscribe, () => store, () => empty)
  // store 是模块级的：只把属于当前账号的数据交给组件，退出登录后不残留上一个账号的成交
  return userId && current.userId === userId ? current : empty
}
