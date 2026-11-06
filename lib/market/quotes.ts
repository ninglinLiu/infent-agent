import { fetchDirectJson } from '@/lib/http'
import { findAsset, type Asset } from './universe'

export type LiveQuote = {
  symbol: string
  price: number
  previousClose: number | null
  changePct: number | null
  currency: string
  /** 报价时间（交易所给出的最后成交时间），ISO */
  quotedAt: string
  /** 当前是否处于常规交易时段 */
  open: boolean
  /** 当日 5 分钟收盘价，用于迷你走势线 */
  spark: number[]
  source: 'Yahoo Finance'
}

type SparkMeta = {
  symbol?: string
  currency?: string
  regularMarketPrice?: number
  regularMarketTime?: number
  previousClose?: number
  chartPreviousClose?: number
  currentTradingPeriod?: { regular?: { start?: number; end?: number } }
}
type SparkResponse = {
  spark?: { result?: Array<{ symbol?: string; response?: Array<{ meta?: SparkMeta; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> }> }
}

const TTL_MS = 4_000
const cache = new Map<string, { at: number; quote: LiveQuote | null }>()
const inflight = new Map<string, Promise<void>>()

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function parseSpark(json: SparkResponse, assets: Asset[], now = Date.now()): Map<string, LiveQuote> {
  const out = new Map<string, LiveQuote>()
  for (const row of json.spark?.result ?? []) {
    const asset = assets.find(item => item.yahoo === row.symbol)
    const response = row.response?.[0]
    const meta = response?.meta
    if (!asset || !meta || !finite(meta.regularMarketPrice) || meta.regularMarketPrice <= 0 || !finite(meta.regularMarketTime)) continue
    const previous = finite(meta.previousClose) ? meta.previousClose : finite(meta.chartPreviousClose) ? meta.chartPreviousClose : null
    const period = meta.currentTradingPeriod?.regular
    const seconds = now / 1000
    const open = finite(period?.start) && finite(period?.end) && seconds >= period.start && seconds <= period.end && seconds - meta.regularMarketTime < 30 * 60
    const closes = (response?.indicators?.quote?.[0]?.close ?? []).filter(finite)
    out.set(asset.symbol, {
      symbol: asset.symbol,
      price: meta.regularMarketPrice,
      previousClose: previous,
      changePct: previous ? (meta.regularMarketPrice / previous - 1) * 100 : null,
      currency: meta.currency || 'USD',
      quotedAt: new Date(meta.regularMarketTime * 1000).toISOString(),
      open,
      spark: closes.slice(-96).map(value => +value.toFixed(asset.dp + 2)),
      source: 'Yahoo Finance',
    })
  }
  return out
}

async function refresh(assets: Asset[]) {
  const symbols = assets.map(asset => asset.yahoo).join(',')
  const json = await fetchDirectJson<SparkResponse>(`https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1d&interval=5m`, 8_000)
  const parsed = parseSpark(json, assets)
  const at = Date.now()
  for (const asset of assets) cache.set(asset.symbol, { at, quote: parsed.get(asset.symbol) ?? null })
}

/** 批量取实时报价。只接受白名单代码；同一实例 4 秒内复用结果。 */
export async function loadQuotes(symbols: string[]): Promise<Map<string, LiveQuote>> {
  const assets = [...new Set(symbols)].map(symbol => findAsset(symbol)).filter((asset): asset is Asset => !!asset)
  const stale = assets.filter(asset => (Date.now() - (cache.get(asset.symbol)?.at ?? 0)) > TTL_MS)
  const jobs: Promise<void>[] = []
  for (let i = 0; i < stale.length; i += 20) {
    const chunk = stale.slice(i, i + 20)
    const key = chunk.map(asset => asset.symbol).join(',')
    let job = inflight.get(key)
    if (!job) {
      job = refresh(chunk).finally(() => inflight.delete(key))
      inflight.set(key, job)
    }
    jobs.push(job)
  }
  const results = await Promise.allSettled(jobs)
  if (jobs.length && results.every(result => result.status === 'rejected') && !assets.some(asset => cache.get(asset.symbol)?.quote)) {
    throw new Error('Quote provider unavailable')
  }
  const out = new Map<string, LiveQuote>()
  for (const asset of assets) {
    const quote = cache.get(asset.symbol)?.quote
    if (quote) out.set(asset.symbol, quote)
  }
  return out
}
