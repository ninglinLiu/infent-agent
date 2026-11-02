import type { ExecutionPlan, Position } from './engine'
import type { StrategySpec } from '@/lib/quant/strategy'

export type SandboxOrderRow = {
  id: string
  execution_id: string
  symbol: string
  side: 'buy' | 'sell'
  qty: number
  quote_price: number
  quoted_at: string
  session: 'open' | 'closed'
  oracle_price: number | null
  oracle_updated_at: string | null
  oracle_round: string | null
  slippage_bps: number
  fill_price: number
  fee: number
  notional: number
  created_at: string
}

export type SandboxExecutionRow = {
  id: string
  kind: 'strategy' | 'close'
  strategy_ref: string | null
  title: string
  cash_before: number
  cash_after: number
  created_at: string
}

export type SandboxPortfolio = {
  /** db：已写入 Supabase；local：迁移未上线，账本保存在本浏览器 */
  mode: 'db' | 'local'
  cash: number
  epoch: number
  positions: Position[]
  executions: SandboxExecutionRow[]
  orders: SandboxOrderRow[]
}

export type ExecutionReport = {
  mode: 'db' | 'local'
  executionId: string
  kind: 'strategy' | 'close'
  title: string
  strategyRef: string | null
  spec: StrategySpec | null
  plan: ExecutionPlan
  orderIds: string[]
  cash: number
  /** 每个阶段的真实耗时（毫秒） */
  timings: { validate: number; quotes: number; oracle: number; ledger: number; total: number }
  at: string
}
