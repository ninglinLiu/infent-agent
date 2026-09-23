import { NextResponse } from "next/server"
import { searchInstruments } from "@/lib/market/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim().slice(0, 40)
  try {
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
