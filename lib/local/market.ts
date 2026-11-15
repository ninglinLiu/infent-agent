import snapshot from '@/public/data/history/lessons.json'
import type { DailySeries } from '@/lib/market/history'
import type { LiveQuote } from '@/lib/market/quotes'
import type { KlinePayload } from '@/lib/market/types'
import { findAsset } from '@/lib/market/universe'

export const LOCAL_SYMBOLS = Object.keys(snapshot.series)
export const SNAPSHOT_SOURCE = `Yahoo Finance historical snapshot / 本地历史快照 (${snapshot.snapshot})`
export const SNAPSHOT_END = snapshot.dates[snapshot.dates.length - 1]
export function snapshotDaily(symbol: string, range = '2y'): DailySeries {
  const data = (snapshot.series as Record<string, number[]>)[symbol]
  if (!data) throw new Error(`Local history supports ${LOCAL_SYMBOLS.join(', ')} only`)
  const n = range === '1y' ? 252 : range === '2y' ? 504 : data.length
  return { symbol, dates: snapshot.dates.slice(-n), closes: data.slice(-n), source: SNAPSHOT_SOURCE }
}
export function snapshotQuotes(symbols: string[]): Map<string, LiveQuote> {
  const rows = new Map<string, LiveQuote>()
  for (const symbol of symbols) {
    if (!LOCAL_SYMBOLS.includes(symbol)) continue
    const h = snapshotDaily(symbol)
    const price = h.closes[h.closes.length - 1], previousClose = h.closes[h.closes.length - 2]
    rows.set(symbol, { symbol, price, previousClose, changePct:(price/previousClose-1)*100,currency:'USD',quotedAt:`${SNAPSHOT_END}T21:00:00Z`,open:false,spark:h.closes.slice(-60),source:SNAPSHOT_SOURCE })
  }
  return rows
}
export function snapshotKlines(symbol: string): KlinePayload {
  const asset=findAsset(symbol), h=snapshotDaily(symbol)
  const quote=snapshotQuotes([symbol]).get(symbol)!
  return { instrument:{symbol,name:asset?.name||symbol,nameEn:asset?.nameEn||symbol,market:'Historical snapshot',timeZone:asset?.tz},interval:'D',source:'snapshot',precision:2,
    // The source has adjusted daily closes only. Do not fabricate OHLC ranges or volume.
    candles:h.dates.map((time,i)=>({time,open:h.closes[i],high:h.closes[i],low:h.closes[i],close:h.closes[i],volume:0})),
    quote:{price:quote.price,previous:quote.previousClose!,change:quote.price-quote.previousClose!,changePct:quote.changePct!,currency:'USD'} }
}
