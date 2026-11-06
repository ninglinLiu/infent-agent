import { z } from 'zod'
import { loadQuotes } from '../market/quotes'
import { findAsset } from '../market/universe'
import type { ToolResult } from './tools'

export const overviewInput = z.object({ scope: z.enum(['global', 'us', 'hk', 'cn', 'jp']).optional() }).strict()
const SCOPES = {
  global: ['SPX', 'NDX', 'HSI', 'CSI300', 'N225', 'VIX', 'US10Y', 'DXY', 'XAU', 'WTI', 'USDCNH'],
  us: ['SPX', 'NDX', 'VIX', 'US10Y', 'DXY', 'NVDA', 'AAPL', 'MSFT', 'XAU', 'WTI'],
  hk: ['HSI', '2800.HK', '0700.HK', '9988.HK', 'USDCNH', 'XAU'],
  cn: ['CSI300', 'USDCNH', 'HSI', 'XAU'],
  jp: ['N225', 'USDJPY', 'US10Y', 'WTI'],
} as const

/** Reuses the terminal's cached, allowlisted batch feed, not browser-supplied prices. */
export async function marketOverview(input: z.infer<typeof overviewInput>, reader: typeof loadQuotes = loadQuotes): Promise<ToolResult> {
  const scope = input.scope ?? 'global'
  const wanted = [...SCOPES[scope]]
  const quotes = await reader(wanted)
  const observedAt = new Date().toISOString()
  const rows = wanted.flatMap(symbol => {
    const q = quotes.get(symbol)
    if (!q) return []
    const asset = findAsset(symbol)!
    return [{
      symbol, providerSymbol: asset.yahoo,
      name: symbol === 'XAU' ? '黄金期货（行情代理）' : symbol === 'WTI' ? 'WTI 原油期货' : asset.name,
      nameEn: symbol === 'XAU' ? 'Gold futures (price proxy)' : symbol === 'WTI' ? 'WTI crude futures' : asset.nameEn,
      price: q.price, previousClose: q.previousClose, changePct: q.changePct,
      unit: symbol === 'US10Y' ? 'percent yield' : asset.cls === 'index' ? 'index points' : q.currency,
      quotedAt: q.quotedAt, timeZone: asset.tz, regularSessionOpen: q.open,
      quoteAgeSeconds: Math.max(0, Math.round((Date.parse(observedAt) - Date.parse(q.quotedAt)) / 1000)),
      source: q.source,
    }]
  })
  if (!rows.length) return { ok: false, code: 'UNAVAILABLE', message: 'The market feed returned no usable quotes. Do not invent a market overview.' }
  return { ok: true, source: 'Yahoo Finance (same batch feed as the market terminal)', observedAt, data: {
    scope, quotes: rows, unavailableSymbols: wanted.filter(symbol => !quotes.has(symbol)),
    note: 'Latest available snapshots, not news. changePct is percent versus each instrument\'s previous close, not a synchronized global trading day. Use each quotedAt and timeZone; observedAt is retrieval time. Closed markets may show their last session, and quotes may be delayed or old. Do not present old quotes as today\'s trading. Missing changes are unknown, not zero. US10Y is a yield in percent, not a dollar price. XAU and WTI here are futures proxies. Do not infer news causes, volume, market breadth or sector flows from these quotes.',
  } }
}
