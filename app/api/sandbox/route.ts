import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { accountAuth, accountError, AccountError, readBody, type AccountContext } from '@/lib/account/server'
import { loadQuotes } from '@/lib/market/quotes'
import { loadOracle, type OracleReading } from '@/lib/market/chainlink'
import { planClose, planStrategy, positionsFrom, STARTING_CASH, type ExecutionPlan, type Position } from '@/lib/sandbox/engine'
import { normalizeSpec, specId, strategySpec, type StrategySpec } from '@/lib/quant/strategy'
import type { ExecutionReport, SandboxExecutionRow, SandboxOrderRow, SandboxPortfolio } from '@/lib/sandbox/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const localLedger = z.object({
  cash: z.number().finite().min(0).max(10_000_000),
  positions: z.array(z.object({ symbol: z.string().max(12), qty: z.number().finite().positive(), cost: z.number().finite().min(0) }).strict()).max(40),
}).strict()
const body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('execute'), operationId: z.string().uuid(), spec: z.unknown(), backtest: z.record(z.unknown()).optional(), local: localLedger.optional() }).strict(),
  z.object({ action: z.literal('close'), operationId: z.string().uuid(), symbol: z.string().trim().toUpperCase().max(12), local: localLedger.optional() }).strict(),
  z.object({ action: z.literal('reset') }).strict(),
])

/** 迁移尚未应用到当前数据库时，PostgREST 报表/函数不存在。 */
function missingSchema(error: { code?: string; message?: string } | null) {
  return !!error && (['PGRST202', 'PGRST205', '42P01', '42883'].includes(error.code ?? '') || /does not exist|schema cache/i.test(error.message ?? ''))
}

const num = (value: unknown) => Number(value)

async function readPortfolio(ctx: AccountContext): Promise<SandboxPortfolio | null> {
  const account = await ctx.db.from('sandbox_accounts').select('cash, epoch').eq('user_id', ctx.user.id).maybeSingle()
  if (missingSchema(account.error)) return null
  if (account.error) throw account.error
  const epoch = account.data?.epoch ?? 1
  const [orders, executions] = await Promise.all([
    ctx.db.from('sandbox_orders').select('id, execution_id, symbol, side, qty, quote_price, quoted_at, session, oracle_price, oracle_updated_at, oracle_round, slippage_bps, fill_price, fee, notional, created_at').eq('user_id', ctx.user.id).eq('epoch', epoch).order('created_at', { ascending: true }).limit(400),
    ctx.db.from('sandbox_executions').select('id, kind, strategy_ref, title, cash_before, cash_after, created_at').eq('user_id', ctx.user.id).eq('epoch', epoch).order('created_at', { ascending: false }).limit(30),
  ])
  if (orders.error) throw orders.error
  if (executions.error) throw executions.error
  const rows = (orders.data ?? []).map(row => ({ ...row, qty: num(row.qty), quote_price: num(row.quote_price), oracle_price: row.oracle_price === null ? null : num(row.oracle_price), slippage_bps: num(row.slippage_bps), fill_price: num(row.fill_price), fee: num(row.fee), notional: num(row.notional) })) as SandboxOrderRow[]
  return {
    mode: 'db', epoch,
    cash: account.data ? num(account.data.cash) : STARTING_CASH,
    positions: positionsFrom(rows),
    executions: (executions.data ?? []).map(row => ({ ...row, cash_before: num(row.cash_before), cash_after: num(row.cash_after) })) as SandboxExecutionRow[],
    orders: rows.slice(-120).reverse(),
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await accountAuth.require(req)
    const portfolio = await readPortfolio(ctx)
    return ctx.finish(NextResponse.json(portfolio ?? { mode: 'local' }))
  } catch (error) { return accountError(error) }
}

const hits = new Map<string, number[]>()
function limited(key: string) {
  const now = Date.now()
  const times = (hits.get(key) ?? []).filter(t => now - t < 60_000)
  if (times.length >= 10) return true
  hits.set(key, [...times, now])
  if (hits.size > 5000) hits.clear()
  return false
}

function compactBacktest(value: Record<string, unknown> | undefined) {
  if (!value) return null
  const { curve: _curve, legs: _legs, ...rest } = value
  void _curve; void _legs
  const text = JSON.stringify(rest)
  return text.length <= 4000 ? rest : null
}

export async function POST(req: NextRequest) {
  const started = Date.now()
  try {
    const ctx = await accountAuth.require(req)
    if (limited(ctx.user.id)) throw new AccountError(429, '操作太频繁，请稍后再试 / Too many requests.')
    const parsed = body.safeParse(await readBody(req, 16_384))
    if (!parsed.success) throw new AccountError(400, 'Invalid sandbox request.')
    const input = parsed.data

    if (input.action === 'reset') {
      const { data, error } = await ctx.db.rpc('sandbox_reset')
      if (missingSchema(error)) return ctx.finish(NextResponse.json({ mode: 'local', cash: STARTING_CASH }))
      if (error) throw error
      return ctx.finish(NextResponse.json({ mode: 'db', ...(data as object) }))
    }

    let spec: StrategySpec | null = null
    if (input.action === 'execute') {
      const checked = strategySpec.safeParse(normalizeSpec(input.spec))
      if (!checked.success) throw new AccountError(400, 'Strategy failed validation.')
      spec = checked.data
    }
    const validated = Date.now()

    const portfolio = await readPortfolio(ctx)
    const mode = portfolio ? 'db' : 'local'
    const cash = portfolio?.cash ?? input.local?.cash ?? STARTING_CASH
    const positions: Position[] = portfolio?.positions ?? input.local?.positions ?? []
    const symbols = spec ? spec.legs.map(leg => leg.symbol) : [(input as { symbol: string }).symbol]

    const quoteStart = Date.now()
    const quotes = await loadQuotes(symbols).catch(() => new Map())
    const quoteMs = Date.now() - quoteStart
    const oracleStart = Date.now()
    const oracle = await loadOracle().catch(() => new Map<string, OracleReading>())
    const oracleMs = Date.now() - oracleStart

    const plan: ExecutionPlan = spec
      ? planStrategy(spec, cash, quotes, oracle)
      : planClose(symbols[0], positions.find(p => p.symbol === symbols[0]), cash, quotes.get(symbols[0]), oracle.get(symbols[0]))
    const title = spec ? spec.title : `平仓 ${symbols[0]} / Close ${symbols[0]}`
    const strategyRef = spec ? specId(spec) : null

    const report: ExecutionReport = {
      mode, executionId: input.operationId, kind: spec ? 'strategy' : 'close', title, strategyRef, spec, plan,
      orderIds: [], cash: plan.cashAfter,
      timings: { validate: validated - started, quotes: quoteMs, oracle: oracleMs, ledger: 0, total: 0 },
      at: new Date().toISOString(),
    }
    if (!plan.ok) {
      report.cash = cash
      report.timings.total = Date.now() - started
      return ctx.finish(NextResponse.json(report, { status: 422 }))
    }

    if (mode === 'db') {
      const ledgerStart = Date.now()
      const { data, error } = await ctx.db.rpc('sandbox_execute', {
        p_operation_id: input.operationId, p_kind: report.kind, p_title: title, p_strategy_ref: strategyRef,
        p_spec: spec, p_backtest: input.action === 'execute' ? compactBacktest(input.backtest) : null,
        p_checks: plan.checks,
        p_orders: plan.orders.map(order => ({
          symbol: order.symbol, side: order.side, qty: order.qty, quote_price: order.quotePrice, quoted_at: order.quotedAt, session: order.session,
          oracle_price: order.oraclePrice, oracle_updated_at: order.oracleUpdatedAt, oracle_round: order.oracleRound,
          slippage_bps: order.slippageBps, fill_price: order.fillPrice, fee: order.fee, notional: order.notional,
        })),
      })
      if (error) {
        if (error.message.includes('Quota exceeded')) throw new AccountError(429, '今日模拟执行次数已用完 / Daily sandbox quota reached.')
        if (/Insufficient (cash|position)/.test(error.message)) throw new AccountError(409, '可用现金或持仓不足 / Insufficient cash or position.')
        throw error
      }
      const result = data as { cash: number; order_ids?: string[] }
      report.cash = num(result.cash)
      report.orderIds = result.order_ids ?? []
      report.timings.ledger = Date.now() - ledgerStart
    }
    report.timings.total = Date.now() - started
    return ctx.finish(NextResponse.json(report))
  } catch (error) { return accountError(error) }
}
