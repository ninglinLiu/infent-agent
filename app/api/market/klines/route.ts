import { NextResponse } from "next/server"
import { loadKlines } from "@/lib/market/server"
import type { ChartInterval } from "@/lib/market/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const INTERVALS = new Set<ChartInterval>(["1", "5", "15", "60", "240", "D"])

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const intervalRaw = (searchParams.get("interval") ?? "60") as ChartInterval
  const interval = INTERVALS.has(intervalRaw) ? intervalRaw : "60"

  try {
    const payload = await loadKlines({
      symbol: searchParams.get("symbol") ?? undefined,
      secid: searchParams.get("secid") ?? undefined,
      yahoo: searchParams.get("yahoo") ?? undefined,
      market: searchParams.get("market") ?? undefined,
      name: searchParams.get("name") ?? undefined,
      nameEn: searchParams.get("nameEn") ?? undefined,
      tv: searchParams.get("tv") ?? undefined,
      timeZone: searchParams.get("tz") ?? undefined,
      interval,
    })
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "klines failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
