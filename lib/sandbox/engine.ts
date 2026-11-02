import type { LiveQuote } from '@/lib/market/quotes'
import type { OracleReading } from '@/lib/market/chainlink'
import { findAsset } from '@/lib/market/universe'
import type { StrategySpec } from '@/lib/quant/strategy'

/**
 * 模拟沙箱撮合。纯函数：输入策略、账户和行情快照，输出订单与风控检查。
 * 价格全部来自真实报价；滑点、手续费是透明的规则，不是随机数。
 */

export const STARTING_CASH = 100_000
export const FEE_RATE = 0.0003
export const MIN_FEE = 1
export const ORACLE_TOLERANCE = 0.02

export type Position = { symbol: string; qty: number; cost: number }

export type PlannedOrder = {
  symbol: string
  side: 'buy' | 'sell'
  qty: number
  quotePrice: number
  quotedAt: string
  session: 'open' | 'closed'
  oraclePrice: number | null
  oracleUpdatedAt: string | null
  oracleRound: string | null
  deviation: number | null
  slippageBps: number
  fillPrice: number
  fee: number
  notional: number
}

export type RiskCheck = { id: string; status: 'pass' | 'warn' | 'fail'; zh: string; en: string }

export type ExecutionPlan = {
  orders: PlannedOrder[]
  checks: RiskCheck[]
  cashBefore: number
  cashAfter: number
  gross: number
  fees: number
  ok: boolean
}

function lotSize(symbol: string) {
  const asset = findAsset(symbol)
  return asset?.cls === 'metal' ? 0.01 : 1
}

/** 2bp 基础滑点 + 每 10 万美元成交额 1bp 冲击；闭市按最后报价成交再加 3bp。 */
export function slippageBps(notional: number, session: 'open' | 'closed') {
  return +(2 + (notional / 100_000) + (session === 'closed' ? 3 : 0)).toFixed(2)
}

export function feeFor(notional: number) {
  return +Math.max(MIN_FEE, notional * FEE_RATE).toFixed(2)
}

function priceOrder(symbol: string, side: 'buy' | 'sell', qty: number, quote: LiveQuote, oracle: OracleReading | undefined): PlannedOrder {
  const session = quote.open ? 'open' : 'closed'
  const rough = qty * quote.price
  const bps = slippageBps(rough, session)
  const fillPrice = +(quote.price * (1 + (side === 'buy' ? bps : -bps) / 10_000)).toFixed(4)
  const notional = +(qty * fillPrice).toFixed(2)
  return {
    symbol, side, qty, quotePrice: quote.price, quotedAt: quote.quotedAt, session,
    oraclePrice: oracle?.price ?? null, oracleUpdatedAt: oracle?.updatedAt ?? null, oracleRound: oracle?.roundId ?? null,
    deviation: oracle ? +(quote.price / oracle.price - 1).toFixed(5) : null,
    slippageBps: bps, fillPrice, fee: feeFor(notional), notional,
  }
}

function oracleChecks(orders: PlannedOrder[]): RiskCheck[] {
  const checked = orders.filter(order => order.deviation !== null)
  if (!checked.length) return [{ id: 'oracle', status: 'warn', zh: '本次标的没有链上喂价，跳过预言机校验', en: 'No on-chain feed for these symbols; oracle check skipped' }]
  const worst = checked.reduce((a, b) => Math.abs(b.deviation!) > Math.abs(a.deviation!) ? b : a)
  const pct = (Math.abs(worst.deviation!) * 100).toFixed(2)
  return [{
    id: 'oracle', status: Math.abs(worst.deviation!) <= ORACLE_TOLERANCE ? 'pass' : 'warn',
    zh: `Chainlink 校验 ${checked.length} 个标的，最大偏离 ${pct}%（${worst.symbol}，阈值 ${ORACLE_TOLERANCE * 100}%）`,
    en: `Chainlink checked ${checked.length} symbols, max deviation ${pct}% (${worst.symbol}, limit ${ORACLE_TOLERANCE * 100}%)`,
  }]
}

export function planStrategy(spec: StrategySpec, cash: number, quotes: Map<string, LiveQuote>, oracle: Map<string, OracleReading>): ExecutionPlan {
  const checks: RiskCheck[] = []
  const orders: PlannedOrder[] = []
  const budget = Math.min(spec.capital, cash)
  const usd = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`
  if (spec.capital > cash) checks.push({ id: 'capital', status: 'warn', zh: `策略本金 ${usd(spec.capital)} 超过可用现金，按 ${usd(cash)} 等比缩放`, en: `Capital exceeds cash; scaled to ${usd(cash)}` })
  else checks.push({ id: 'capital', status: 'pass', zh: `本金 ${usd(spec.capital)} ≤ 可用现金 ${usd(cash)}`, en: `Capital ${usd(spec.capital)} within cash ${usd(cash)}` })

  const maxWeight = Math.max(...spec.legs.map(leg => leg.weight))
  checks.push({ id: 'concentration', status: maxWeight > 0.6 ? 'warn' : 'pass', zh: `单一标的最大权重 ${(maxWeight * 100).toFixed(0)}%（提示线 60%）`, en: `Largest single weight ${(maxWeight * 100).toFixed(0)}% (flag at 60%)` })

  const missing: string[] = []
  for (const leg of spec.legs) {
    const quote = quotes.get(leg.symbol)
    if (!quote) { missing.push(leg.symbol); continue }
    const lot = lotSize(leg.symbol)
    // 预留滑点和手续费，向下取整到最小交易单位
    const target = (budget * leg.weight) / (quote.price * (1 + 10 / 10_000))
    const qty = +(Math.floor(target / lot) * lot).toFixed(4)
    if (qty <= 0) { checks.push({ id: `lot-${leg.symbol}`, status: 'warn', zh: `${leg.symbol} 分配金额不足 1 个交易单位，跳过`, en: `${leg.symbol} allocation below one lot; skipped` }); continue }
    orders.push(priceOrder(leg.symbol, 'buy', qty, quote, oracle.get(leg.symbol)))
  }
  if (missing.length) checks.push({ id: 'quotes', status: 'fail', zh: `${missing.join(', ')} 暂无实时报价，拒绝下单`, en: `No live quote for ${missing.join(', ')}; rejected` })
  else checks.push({ id: 'quotes', status: 'pass', zh: `${orders.length} 个标的取得实时报价`, en: `Live quotes for ${orders.length} symbols` })

  const closed = orders.filter(order => order.session === 'closed')
  checks.push(closed.length
    ? { id: 'session', status: 'warn', zh: `${closed.map(o => o.symbol).join(', ')} 当前闭市，按最后报价模拟成交并加 3bp 滑点`, en: `${closed.map(o => o.symbol).join(', ')} closed; filled at last quote +3bp` }
    : { id: 'session', status: 'pass', zh: '全部标的处于交易时段', en: 'All symbols in session' })
  checks.push(...oracleChecks(orders))

  const gross = orders.reduce((sum, order) => sum + order.notional, 0)
  const fees = orders.reduce((sum, order) => sum + order.fee, 0)
  const cashAfter = +(cash - gross - fees).toFixed(2)
  if (cashAfter < 0) checks.push({ id: 'cash', status: 'fail', zh: '成交额加手续费超过可用现金', en: 'Notional plus fees exceeds cash' })
  if (!orders.length) checks.push({ id: 'empty', status: 'fail', zh: '没有可执行的订单', en: 'No executable orders' })
  return { orders, checks, cashBefore: cash, cashAfter, gross: +gross.toFixed(2), fees: +fees.toFixed(2), ok: !checks.some(check => check.status === 'fail') }
}

export function planClose(symbol: string, position: Position | undefined, cash: number, quote: LiveQuote | undefined, oracle: OracleReading | undefined): ExecutionPlan {
  const checks: RiskCheck[] = []
  if (!position || position.qty <= 0) checks.push({ id: 'position', status: 'fail', zh: `没有 ${symbol} 持仓`, en: `No ${symbol} position` })
  if (!quote) checks.push({ id: 'quotes', status: 'fail', zh: `${symbol} 暂无实时报价`, en: `No live quote for ${symbol}` })
  if (checks.length) return { orders: [], checks, cashBefore: cash, cashAfter: cash, gross: 0, fees: 0, ok: false }
  const order = priceOrder(symbol, 'sell', position!.qty, quote!, oracle)
  checks.push({ id: 'position', status: 'pass', zh: `平仓 ${position!.qty} ${symbol}`, en: `Close ${position!.qty} ${symbol}` }, ...oracleChecks([order]))
  return { orders: [order], checks, cashBefore: cash, cashAfter: +(cash + order.notional - order.fee).toFixed(2), gross: order.notional, fees: order.fee, ok: true }
}

/** 由成交记录汇总持仓（平均成本法）。 */
export function positionsFrom(orders: Array<{ symbol: string; side: 'buy' | 'sell'; qty: number; fill_price: number }>): Position[] {
  const book = new Map<string, Position>()
  for (const order of orders) {
    const p = book.get(order.symbol) ?? { symbol: order.symbol, qty: 0, cost: 0 }
    if (order.side === 'buy') {
      p.cost = (p.cost * p.qty + order.fill_price * order.qty) / (p.qty + order.qty)
      p.qty = +(p.qty + order.qty).toFixed(4)
    } else {
      p.qty = +(p.qty - order.qty).toFixed(4)
      if (p.qty <= 0) { p.qty = 0; p.cost = 0 }
    }
    book.set(order.symbol, p)
  }
  return [...book.values()].filter(p => p.qty > 0)
}
