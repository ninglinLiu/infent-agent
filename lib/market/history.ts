import { fetchDirectJson } from '@/lib/http'
import { findAsset } from './universe'

/** 日线收盘（已复权），date 为交易所当地日期 YYYY-MM-DD。 */
export type DailySeries = { symbol: string; dates: string[]; closes: number[]; source: 'Yahoo Finance' }

type YahooDaily = {
  chart?: { result?: Array<{
    meta?: { exchangeTimezoneName?: string }
    timestamp?: number[]
    indicators?: { adjclose?: Array<{ adjclose?: Array<number | null> }>; quote?: Array<{ close?: Array<number | null> }> }
  }> }
}

const TTL_MS = 60 * 60 * 1000
const cache = new Map<string, { at: number; series: Promise<DailySeries> }>()

function localDate(seconds: number, tz: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(seconds * 1000))
}

export function parseDaily(symbol: string, json: YahooDaily): DailySeries {
  const result = json.chart?.result?.[0]
  const stamps = result?.timestamp ?? []
  const adjusted = result?.indicators?.adjclose?.[0]?.adjclose
  const raw = result?.indicators?.quote?.[0]?.close
  const tz = result?.meta?.exchangeTimezoneName || 'America/New_York'
  const dates: string[] = []
  const closes: number[] = []
  stamps.forEach((stamp, i) => {
    const value = adjusted?.[i] ?? raw?.[i]
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return
    const date = localDate(stamp, tz)
    if (dates[dates.length - 1] === date) { closes[closes.length - 1] = value; return }
    dates.push(date)
    closes.push(value)
  })
  if (closes.length < 30) throw new Error(`Not enough history for ${symbol}`)
  return { symbol, dates, closes, source: 'Yahoo Finance' }
}

/** 白名单品种的日线历史，实例内缓存 1 小时。range 例如 1y / 2y / 5y。 */
export function loadDaily(symbol: string, range: '1y' | '2y' | '3y' | '5y' = '2y'): Promise<DailySeries> {
  const asset = findAsset(symbol)
  if (!asset) return Promise.reject(new Error(`Unsupported symbol ${symbol}`))
  const key = `${asset.symbol}:${range}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.series
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.yahoo)}?interval=1d&range=${range}&events=div%2Csplit`
  // 上游偶发断连时重试一次，和 K 线接口的策略一致
  const series = fetchDirectJson<YahooDaily>(url, 8_000)
    .catch(() => fetchDirectJson<YahooDaily>(url, 8_000))
    .then(json => parseDaily(asset.symbol, json))
  series.catch(() => cache.delete(key))
  cache.set(key, { at: Date.now(), series })
  return series
}
