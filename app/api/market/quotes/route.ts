import { NextResponse } from 'next/server'
import { loadQuotes } from '@/lib/market/quotes'
import { BOARD, findAsset } from '@/lib/market/universe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 实时报价。默认返回固定的行情墙（一个 CDN 缓存键）；
 * ?symbols= 只接受白名单内最多 12 个代码。CDN 缓存 5 秒，控制 Vercel 免费额度。
 */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('symbols')
  const symbols = raw
    ? [...new Set(raw.split(',').map(s => findAsset(s)?.symbol).filter((s): s is string => !!s))].slice(0, 12)
    : BOARD
  if (!symbols.length) return NextResponse.json({ error: 'No supported symbols' }, { status: 400 })
  try {
    const quotes = await loadQuotes(symbols)
    return NextResponse.json({ quotes: [...quotes.values()], servedAt: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=25' },
    })
  } catch {
    return NextResponse.json({ error: 'Quote provider unavailable' }, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=5' } })
  }
}
