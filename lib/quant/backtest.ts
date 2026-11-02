import type { StrategySpec } from './strategy'
import { beta, correlation, maxDrawdown, mean, round, stdev } from './stats'

export type PriceSeries = { symbol: string; dates: string[]; closes: number[] }

export type BacktestResult = {
  start: string
  end: string
  days: number
  capital: number
  finalValue: number
  totalReturn: number
  cagr: number
  volatility: number
  /** 无风险利率按 0 计 */
  sharpe: number
  maxDrawdown: number
  drawdownFrom: string
  drawdownTo: string
  stopTriggers: number
  rebalances: number
  costs: number
  monthlyWinRate: number
  bestMonth: number
  worstMonth: number
  benchmark: { symbol: string; totalReturn: number; maxDrawdown: number; volatility: number }
  betaToBenchmark: number
  correlationToBenchmark: number
  legs: Array<{ symbol: string; weight: number; totalReturn: number; contribution: number }>
  /** 降采样后的净值曲线：[日期, 策略净值, 基准净值]，基准按同样本金换算 */
  curve: Array<[string, number, number]>
  method: string
}

const COST_BPS = 5
const REENTRY_DAYS = 21

/** 只保留所有序列都有收盘价的日期（不同市场假期不同）。 */
export function alignSeries(series: PriceSeries[]) {
  const maps = series.map(item => new Map(item.dates.map((date, i) => [date, item.closes[i]])))
  const dates = series[0].dates.filter(date => maps.every(map => map.has(date)))
  return { dates, prices: maps.map(map => dates.map(date => map.get(date)!)) }
}

function periodKey(date: string, rule: StrategySpec['rebalance']) {
  if (rule === 'monthly') return date.slice(0, 7)
  if (rule === 'quarterly') return `${date.slice(0, 4)}Q${Math.floor((Number(date.slice(5, 7)) - 1) / 3)}`
  return ''
}

function downsample<T>(rows: T[], points: number): T[] {
  if (rows.length <= points) return rows
  const step = (rows.length - 1) / (points - 1)
  return Array.from({ length: points }, (_, i) => rows[Math.round(i * step)])
}

/**
 * 日频回测：首日按目标权重建仓，剩余为现金；按月/季再平衡；
 * 组合从峰值回撤触及 stopLoss 时全部转为现金，21 个交易日后按目标权重重新入场。
 * 每次调仓按成交额收取 5 bp 成本。全部使用真实复权收盘价。
 */
export function runBacktest(spec: StrategySpec, legs: PriceSeries[], bench: PriceSeries): BacktestResult {
  const ordered = spec.legs.map(leg => {
    const found = legs.find(item => item.symbol === leg.symbol)
    if (!found) throw new Error(`Missing history for ${leg.symbol}`)
    return found
  })
  const { dates, prices } = alignSeries([...ordered, bench])
  if (dates.length < 60) throw new Error('Not enough overlapping history to backtest')
  const benchPrices = prices[prices.length - 1]
  const legPrices = prices.slice(0, -1)
  const weights = spec.legs.map(leg => leg.weight)
  const cost = COST_BPS / 10_000

  let cash = spec.capital
  let units = weights.map(() => 0)
  let costs = 0, rebalances = 0, stopTriggers = 0
  let peak = spec.capital
  let outUntil = -1
  const values: number[] = []

  const valueAt = (t: number) => cash + units.reduce((sum, u, i) => sum + u * legPrices[i][t], 0)
  const rebalanceTo = (t: number, target: number[]) => {
    const total = valueAt(t)
    const next = target.map((w, i) => (total * w) / legPrices[i][t])
    const traded = next.reduce((sum, u, i) => sum + Math.abs(u - units[i]) * legPrices[i][t], 0)
    const fee = traded * cost
    // 成本从组合里按比例扣除，保持目标权重不变
    const scale = total > 0 ? (total - fee) / total : 0
    units = next.map(u => u * scale)
    cash = total - fee - units.reduce((sum, u, i) => sum + u * legPrices[i][t], 0)
    costs += fee
  }

  rebalanceTo(0, weights)
  let lastPeriod = periodKey(dates[0], spec.rebalance)
  for (let t = 0; t < dates.length; t++) {
    if (t > 0) {
      if (outUntil >= 0 && t >= outUntil) {
        outUntil = -1
        rebalanceTo(t, weights)
        peak = valueAt(t)
        lastPeriod = periodKey(dates[t], spec.rebalance)
      } else if (outUntil < 0 && spec.rebalance !== 'none') {
        const key = periodKey(dates[t], spec.rebalance)
        if (key !== lastPeriod) { rebalanceTo(t, weights); rebalances++; lastPeriod = key }
      }
    }
    const value = valueAt(t)
    peak = Math.max(peak, value)
    if (spec.stopLoss && outUntil < 0 && value / peak - 1 <= -spec.stopLoss) {
      rebalanceTo(t, weights.map(() => 0))
      stopTriggers++
      outUntil = t + REENTRY_DAYS
    }
    values.push(valueAt(t))
  }

  const returns = values.slice(1).map((value, i) => value / values[i] - 1)
  const benchValues = benchPrices.map(price => (spec.capital * price) / benchPrices[0])
  const benchReturns = benchValues.slice(1).map((value, i) => value / benchValues[i] - 1)
  const years = Math.max((Date.parse(dates[dates.length - 1]) - Date.parse(dates[0])) / (365.25 * 86400_000), 1 / 12)
  const final = values[values.length - 1]
  const dd = maxDrawdown(values)
  const monthEnds = new Map<string, number>()
  dates.forEach((date, i) => monthEnds.set(date.slice(0, 7), values[i]))
  const monthly = [...monthEnds.values()].map((value, i, all) => i ? value / all[i - 1] - 1 : value / spec.capital - 1)
  const vol = stdev(returns) * Math.sqrt(252)

  return {
    start: dates[0], end: dates[dates.length - 1], days: dates.length,
    capital: spec.capital, finalValue: round(final, 2),
    totalReturn: round(final / spec.capital - 1),
    cagr: round((final / spec.capital) ** (1 / years) - 1),
    volatility: round(vol),
    sharpe: round(vol ? (mean(returns) * 252) / vol : 0, 2),
    maxDrawdown: round(dd.value),
    drawdownFrom: dates[dd.from], drawdownTo: dates[dd.to],
    stopTriggers, rebalances, costs: round(costs, 2),
    monthlyWinRate: round(monthly.filter(r => r > 0).length / Math.max(monthly.length, 1), 3),
    bestMonth: round(Math.max(...monthly)), worstMonth: round(Math.min(...monthly)),
    benchmark: {
      symbol: bench.symbol,
      totalReturn: round(benchValues[benchValues.length - 1] / spec.capital - 1),
      maxDrawdown: round(maxDrawdown(benchValues).value),
      volatility: round(stdev(benchReturns) * Math.sqrt(252)),
    },
    betaToBenchmark: round(beta(returns, benchReturns), 2),
    correlationToBenchmark: round(correlation(returns, benchReturns), 2),
    legs: spec.legs.map((leg, i) => {
      const r = legPrices[i][legPrices[i].length - 1] / legPrices[i][0] - 1
      return { symbol: leg.symbol, weight: leg.weight, totalReturn: round(r), contribution: round(r * leg.weight) }
    }),
    curve: downsample(dates.map((date, i) => [date, round(values[i], 0), round(benchValues[i], 0)] as [string, number, number]), 90),
    method: `Daily adjusted closes (Yahoo Finance), ${COST_BPS}bp per traded notional, rebalance=${spec.rebalance}, stop=${spec.stopLoss ?? 'none'} with ${REENTRY_DAYS}-day re-entry, risk-free rate 0.`,
  }
}
