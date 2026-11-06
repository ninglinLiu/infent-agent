import { alignSeries, type PriceSeries } from './backtest'
import { beta, correlation, correlationPValue, round } from './stats'

/**
 * 领先-滞后驱动分析：「什么在推动这只股票」。
 *
 * 对每个候选驱动 d 和滞后 L∈[0,5]，计算 corr(r_target[t], r_d[t-L])；
 * 再把目标和驱动都对同日大盘收益做 OLS 残差化（剔除「大盘带动一切」），
 * 用残差相关作为保留依据。每个驱动在 6 个滞后中取最强者，显著性阈值按 0.05/6 校正。
 * 这是统计相关，不是因果证明；结果会把这一点写进 caveat。
 */

export type DriverEdge = {
  driver: string
  lag: number
  /** 原始相关 */
  raw: number
  /** 剔除大盘后的残差相关 */
  partial: number
  pValue: number
  kept: boolean
  /** 原始相关显著、剔除大盘后不显著：只是跟着大盘动 */
  confounded: boolean
}

export type DriverReport = {
  target: string
  market: string
  start: string
  end: string
  observations: number
  edges: DriverEdge[]
  method: string
  caveat: string
}

const MAX_LAG = 5
const ALPHA = 0.05 / (MAX_LAG + 1)
const MIN_EFFECT = 0.08

/** 收益率序列；收益率类指数（如 ^TNX）用一阶差分。 */
export function changes(closes: number[], yieldLike = false) {
  return closes.slice(1).map((value, i) => yieldLike ? value - closes[i] : value / closes[i] - 1)
}

function residualize(y: number[], market: number[]) {
  const b = beta(y, market)
  return y.map((value, i) => value - b * market[i])
}

export function analyzeDrivers(target: PriceSeries, market: PriceSeries, drivers: PriceSeries[], yieldLike: Set<string> = new Set()): DriverReport {
  const { dates, prices } = alignSeries([target, market, ...drivers])
  if (dates.length < 80) throw new Error('Not enough overlapping history')
  const [targetR, marketR, ...driverR] = prices.map((closes, i) => {
    const symbol = [target, market, ...drivers][i].symbol
    return changes(closes, yieldLike.has(symbol))
  })
  const targetResid = residualize(targetR, marketR)
  const n = targetR.length

  const edges = drivers.map((driver, d) => {
    const series = driverR[d]
    const resid = driver.symbol === market.symbol ? series : residualize(series, marketR)
    const lags: Array<DriverEdge & { rawSignificant: boolean }> = []
    for (let lag = 0; lag <= MAX_LAG; lag++) {
      const y = targetR.slice(lag), x = series.slice(0, n - lag)
      const yr = targetResid.slice(lag), xr = resid.slice(0, n - lag)
      const raw = correlation(y, x)
      // 大盘本身作为驱动时不能对自己残差化，用原始相关
      const partial = driver.symbol === market.symbol ? raw : correlation(yr, xr)
      const pValue = correlationPValue(partial, y.length)
      const kept = pValue < ALPHA && Math.abs(partial) >= MIN_EFFECT
      const rawSignificant = correlationPValue(raw, y.length) < ALPHA && Math.abs(raw) >= MIN_EFFECT
      lags.push({ driver: driver.symbol, lag, raw: round(raw, 3), partial: round(partial, 3), pValue: round(pValue, 5), kept, confounded: false, rawSignificant })
    }
    const strongest = lags.reduce((a, b) => Math.abs(b.partial) > Math.abs(a.partial) ? b : a)
    // 任何滞后上原始相关显著、但剔除大盘后都不显著：只是跟着大盘动，展示原始相关最强的那个滞后
    const pick = strongest.kept ? strongest : lags.some(l => l.rawSignificant)
      ? { ...lags.reduce((a, b) => Math.abs(b.raw) > Math.abs(a.raw) ? b : a), confounded: true }
      : strongest
    const { rawSignificant: _flag, ...edge } = pick
    void _flag
    return edge
  }).sort((a, b) => Number(b.kept) - Number(a.kept) || Math.abs(b.partial) - Math.abs(a.partial))

  return {
    target: target.symbol, market: market.symbol,
    start: dates[0], end: dates[dates.length - 1], observations: n,
    edges,
    method: `Daily returns, lags 0-${MAX_LAG} trading days, residualized on ${market.symbol} same-day returns, Bonferroni alpha ${ALPHA.toFixed(4)}, |r| >= ${MIN_EFFECT}.`,
    caveat: 'Lead-lag correlation on one year of data; not proof of causation and may not persist out of sample.',
  }
}

/** 不同目标的默认候选驱动：同业、行业 ETF、利率、美元、原油、黄金、波动率。 */
export function defaultDrivers(target: string): { market: string; drivers: string[] } {
  // 盈富基金本身就是港股大盘，它的「大盘」用恒生指数，否则会拿自己对自己做残差
  if (target.endsWith('.HK')) return { market: target === '2800.HK' ? 'HSI' : '2800.HK', drivers: ['2800.HK', 'CSI300', 'USDCNH', 'SPY', 'US10Y', 'XAU', '0700.HK', '9988.HK'].filter(s => s !== target) }
  const peers: Record<string, string[]> = {
    NVDA: ['AMD', 'TSM', 'SOXX'], AMD: ['NVDA', 'TSM', 'SOXX'], TSM: ['NVDA', 'AMD', 'SOXX'],
    AAPL: ['MSFT', 'GOOGL'], MSFT: ['AAPL', 'GOOGL'], GOOGL: ['META', 'MSFT'], META: ['GOOGL', 'AMZN'], AMZN: ['MSFT', 'GOOGL'],
    TSLA: ['QQQ', 'NVDA'], XLE: ['WTI'], GLD: ['XAU', 'XAG'], XAU: ['XAG', 'GLD'], TLT: ['QQQ'],
  }
  const base = ['QQQ', 'US10Y', 'DXY', 'WTI', 'XAU', 'VIX']
  const list = [...(peers[target] ?? []), ...base].filter((s, i, all) => s !== target && all.indexOf(s) === i)
  return { market: 'SPY', drivers: list.slice(0, 8) }
}
