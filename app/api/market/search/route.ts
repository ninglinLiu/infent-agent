import { NextResponse } from "next/server"
import { searchInstruments } from "@/lib/market/server"
import { localDemoEnabled } from '@/lib/local/config'
import { LOCAL_SYMBOLS } from '@/lib/local/market'
import { findAsset } from '@/lib/market/universe'

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim().slice(0, 40)
  try {
    if (localDemoEnabled()) return NextResponse.json({items:LOCAL_SYMBOLS.map(s=>findAsset(s)!).filter(a=>`${a.symbol} ${a.name} ${a.nameEn}`.toLowerCase().includes(q.toLowerCase())).map(a=>({symbol:a.symbol,name:a.name,nameEn:a.nameEn,market:'US',yahoo:a.yahoo,timeZone:a.tz}))})
    const items = await searchInstruments(q)
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : "search failed"
    return NextResponse.json({ items: [], error: message }, { status: 502 })
  }
}
