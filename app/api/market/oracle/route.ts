import { NextResponse } from 'next/server'
import { loadOracle } from '@/lib/market/chainlink'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Chainlink 链上喂价快照。喂价本身按偏离/心跳更新，CDN 缓存 30 秒足够。 */
export async function GET() {
  try {
    const readings = await loadOracle()
    return NextResponse.json({ readings: [...readings.values()], servedAt: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' },
    })
  } catch {
    return NextResponse.json({ error: 'Oracle unavailable' }, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=15' } })
  }
}
