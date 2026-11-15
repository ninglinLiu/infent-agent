import { NextResponse } from 'next/server'
import { loadOracle } from '@/lib/market/chainlink'
import { localDemoEnabled } from '@/lib/local/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Chainlink 链上喂价快照。喂价本身按偏离/心跳更新，CDN 缓存 30 秒足够。 */
export async function GET() {
  if (localDemoEnabled()) return NextResponse.json({readings:[],demo:true,note:'Offline historical demo: no on-chain verification',servedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}})
  try {
    const readings = await loadOracle()
    return NextResponse.json({ readings: [...readings.values()], servedAt: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' },
    })
  } catch {
    return NextResponse.json({ error: 'Oracle unavailable' }, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=15' } })
  }
}
