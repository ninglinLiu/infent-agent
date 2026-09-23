import { fetchDirectJson } from "@/lib/http"
import { filterPresets, resolveInstrument } from "./presets"
import type { Candle, ChartInterval, Instrument, KlinePayload, Quote } from "./types"

const EM_TOKEN = "D43BF722C8E33BDC906FB84D85E326E8"
const EM_UT = "fa5fd1943c7b386f172d6893dbfba10b"

type EmSearch = {
  QuotationCodeTable?: {
    Data?: Array<{
      Code?: string
      Name?: string
      QuoteID?: string
      JYS?: string
      Classify?: string
      SecurityTypeName?: string
      MktNum?: string
      UnifiedCode?: string
    }>
  }
}

type EmKline = {
  rc?: number
  data?: {
    code?: string
    name?: string
    market?: number
    decimal?: number
    preKPrice?: number
    klines?: string[]
  } | null
}

type YahooSearch = {
  quotes?: Array<{
    symbol?: string
    shortname?: string
    longname?: string
    exchDisp?: string
    exchange?: string
    quoteType?: string
    typeDisp?: string
  }>
}

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string
        shortName?: string
        longName?: string
        exchangeName?: string
        regularMarketPrice?: number
        regularMarketChangePercent?: number
        chartPreviousClose?: number
        currency?: string
        exchangeTimezoneName?: string
      }
      timestamp?: number[]
      indicators?: { quote?: Array<{ open?: number[]; high?: number[]; low?: number[]; close?: number[]; volume?: number[] }> }
    }>
    error?: { description?: string } | null
  }
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function guessTimeZone(market: string, classify?: string): string {
  const blob = `${market} ${classify ?? ""}`.toUpperCase()
  if (blob.includes("CRYPTO") || blob.includes("CCC")) return "UTC"
  if (blob.includes("HK") || blob.includes("港")) return "Asia/Hong_Kong"
  if (blob.includes("SSE") || blob.includes("SZ") || blob.includes("SH") || blob.includes("沪") || blob.includes("深") || blob.includes("京") || blob.includes("ASTOCK")) {
    return "Asia/Shanghai"
  }
  return "America/New_York"
}

/** Interpret a naive "YYYY-MM-DD HH:mm" stamp as wall time in `timeZone`. */
function zonedNaiveToUnix(naive: string, timeZone: string): number {
  const [datePart, timePart = "00:00:00"] = naive.trim().split(/\s+/)
  const [y, mo, d] = datePart.split("-").map(Number)
  const [hh, mm, ss = 0] = timePart.split(":").map(Number)
  const utcGuess = Date.UTC(y, mo - 1, d, hh, mm, ss)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(utcGuess))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  let hour = get("hour")
  if (hour === 24) hour = 0
  const asIfTz = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"))
  return Math.floor((utcGuess - (asIfTz - utcGuess)) / 1000)
}

function toBusinessDay(tsSec: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(tsSec * 1000))
}

function yahooToSecid(symbol: string, exchange?: string): string | undefined {
  const s = symbol.toUpperCase()
  if (s.endsWith(".HK")) return `116.${s.replace(".HK", "").padStart(5, "0")}`
  if (s.endsWith(".SS")) return `1.${s.replace(".SS", "")}`
  if (s.endsWith(".SZ")) return `0.${s.replace(".SZ", "")}`
  const ex = (exchange ?? "").toUpperCase()
  if (["NMS", "NAS", "NGM", "NASDAQ"].includes(ex)) return `105.${s}`
  if (["NYQ", "NYSE"].includes(ex)) return `106.${s}`
  if (["ASE", "AMEX", "PCX"].includes(ex)) return `107.${s}`
  return undefined
}

function toTvSymbol(inst: Instrument): string {
  if (inst.tv) return inst.tv
  const m = inst.market.toUpperCase()
  const s = inst.symbol
  if (m.includes("NASDAQ") || m === "NMS") return `NASDAQ:${s}`
  if (m.includes("NYSE")) return `NYSE:${s}`
  if (m.includes("HK")) return `HKEX:${s.replace(/^0+/, "")}`
  if (m.includes("SSE") || m === "SH") return `SSE:${s}`
  if (m.includes("SZ")) return `SZSE:${s}`
  return inst.yahoo ?? s
}

function finalizeInstrument(partial: Instrument): Instrument {
  const preset = resolveInstrument(partial.symbol) ?? (partial.yahoo ? resolveInstrument(partial.yahoo) : undefined)
  return {
    ...preset,
    ...partial,
    name: partial.name || preset?.name || partial.symbol,
    nameEn: partial.nameEn || preset?.nameEn || partial.name || partial.symbol,
    market: partial.market || preset?.market || "",
    secid: partial.secid || preset?.secid,
    yahoo: partial.yahoo || preset?.yahoo || partial.symbol,
    tv: partial.tv || preset?.tv || toTvSymbol({ ...preset, ...partial }),
    timeZone: partial.timeZone || preset?.timeZone || guessTimeZone(partial.market),
  }
}

function quoteFromCandles(candles: Candle[], currency?: string, livePrice?: number): Quote {
  const last = candles[candles.length - 1]
  const prevBar = candles[candles.length - 2]?.close
  const price = livePrice ?? last.close
  const prev =
    livePrice != null && Math.abs(livePrice - last.close) > Math.max(1e-6, Math.abs(last.close) * 1e-6)
      ? last.close
      : prevBar ?? last.close
  const change = price - prev
  return {
    price,
    previous: prev,
    change,
    changePct: prev ? (change / prev) * 100 : 0,
    high: last.high,
    low: last.low,
    volume: last.volume,
    currency,
  }
}

function cleanCandles(rows: Candle[]): Candle[] {
  const seen = new Set<string>()
  const out: Candle[] = []
  for (const c of rows) {
    if (![c.open, c.high, c.low, c.close].every((n) => Number.isFinite(n))) continue
    const key = String(c.time)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      ...c,
      high: Math.max(c.high, c.open, c.close),
      low: Math.min(c.low, c.open, c.close),
      volume: Number.isFinite(c.volume) ? c.volume : 0,
    })
  }
  return out.sort((a, b) => {
    const ta = typeof a.time === "number" ? a.time : Date.parse(String(a.time))
    const tb = typeof b.time === "number" ? b.time : Date.parse(String(b.time))
    return ta - tb
  })
}

function aggregateCandles(candles: Candle[], bucketSec: number): Candle[] {
  const groups = new Map<number, Candle[]>()
  for (const c of candles) {
    const t =
      typeof c.time === "number" ? c.time : Math.floor(new Date(`${c.time}T00:00:00Z`).getTime() / 1000)
    if (!Number.isFinite(t)) continue
    const bucket = Math.floor(t / bucketSec) * bucketSec
    const arr = groups.get(bucket) ?? []
    arr.push(c)
    groups.set(bucket, arr)
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, bars]) => ({
      time,
      open: bars[0].open,
      high: Math.max(...bars.map((b) => b.high)),
      low: Math.min(...bars.map((b) => b.low)),
      close: bars[bars.length - 1].close,
      volume: bars.reduce((s, b) => s + b.volume, 0),
    }))
}

async function searchEastmoney(q: string): Promise<Instrument[]> {
  const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(q)}&type=14&token=${EM_TOKEN}`
  const json = await fetchDirectJson<EmSearch>(url)
  const rows = json.QuotationCodeTable?.Data ?? []
  return rows.slice(0, 10).map((row) => {
    const symbol = (row.UnifiedCode || row.Code || "").toUpperCase()
    const market = row.JYS || row.SecurityTypeName || row.Classify || ""
    return finalizeInstrument({
      symbol,
      name: row.Name || symbol,
      nameEn: symbol,
      market,
      secid: row.QuoteID,
      yahoo: yahooGuessFromEm(symbol, market),
      timeZone: guessTimeZone(market, row.Classify),
    })
  }).filter((i) => i.symbol)
}

function yahooGuessFromEm(symbol: string, market: string): string {
  const m = market.toUpperCase()
  if (m.includes("HK") || m.includes("港")) return `${symbol.replace(/^0+/, "").padStart(4, "0")}.HK`
  if (m.includes("SH") || m.includes("沪") || m.includes("SSE")) return `${symbol}.SS`
  if (m.includes("SZ") || m.includes("深")) return `${symbol}.SZ`
  if (symbol.includes("-") || symbol.includes("=") || symbol.startsWith("^")) return symbol
  return symbol
}

async function searchYahoo(q: string): Promise<Instrument[]> {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`
  const json = await fetchDirectJson<YahooSearch>(url)
  return (json.quotes ?? [])
    .filter((row) => row.symbol)
    .slice(0, 8)
    .map((row) => {
      const symbol = String(row.symbol)
      const market = row.exchDisp || row.exchange || row.typeDisp || ""
      return finalizeInstrument({
        symbol,
        name: row.shortname || row.longname || symbol,
        nameEn: row.longname || row.shortname || symbol,
        market,
        secid: yahooToSecid(symbol, row.exchange || row.exchDisp),
        yahoo: symbol,
        timeZone: guessTimeZone(market),
      })
    })
}

export async function searchInstruments(q: string): Promise<Instrument[]> {
  const query = q.trim()
  if (!query) return filterPresets("", 10)

  const merged = new Map<string, Instrument>()
  const add = (inst: Instrument) => {
    const key = (inst.secid || inst.yahoo || inst.symbol).toUpperCase()
    const prev = merged.get(key)
    merged.set(key, prev ? { ...inst, ...prev, secid: prev.secid || inst.secid, yahoo: prev.yahoo || inst.yahoo } : inst)
  }

  const exact = resolveInstrument(query)
  if (exact) add(exact)
  for (const p of filterPresets(query, 6)) add(p)

  const tasks = [searchEastmoney(query), searchYahoo(query)]
  const results = await Promise.allSettled(tasks)
  for (const r of results) {
    if (r.status === "fulfilled") r.value.forEach(add)
  }

  return [...merged.values()].slice(0, 12)
}

function emKlt(interval: ChartInterval): { klt: number; lmt: number; aggregate?: number } {
  switch (interval) {
    case "1":
      return { klt: 1, lmt: 400 }
    case "5":
      return { klt: 5, lmt: 400 }
    case "15":
      return { klt: 15, lmt: 400 }
    case "60":
      return { klt: 60, lmt: 400 }
    case "240":
      return { klt: 60, lmt: 500, aggregate: 4 * 3600 }
    case "D":
      return { klt: 101, lmt: 500 }
  }
}

function yahooRange(interval: ChartInterval): { interval: string; range: string; aggregate?: number } {
  switch (interval) {
    case "1":
      return { interval: "1m", range: "5d" }
    case "5":
      return { interval: "5m", range: "1mo" }
    case "15":
      return { interval: "15m", range: "1mo" }
    case "60":
      return { interval: "1h", range: "6mo" }
    case "240":
      return { interval: "1h", range: "1y", aggregate: 4 * 3600 }
    case "D":
      return { interval: "1d", range: "2y" }
  }
}

async function klinesEastmoney(inst: Instrument, interval: ChartInterval): Promise<KlinePayload> {
  if (!inst.secid) throw new Error("no eastmoney secid")
  const { klt, lmt, aggregate } = emKlt(interval)
  const url =
    `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${encodeURIComponent(inst.secid)}` +
    `&ut=${EM_UT}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61` +
    `&klt=${klt}&fqt=1&end=20500101&lmt=${lmt}`
  const json = await fetchDirectJson<EmKline>(url)
  const rows = json.data?.klines
  if (!rows?.length) throw new Error(`eastmoney empty ${inst.secid}`)

  const tz = inst.timeZone || "America/New_York"
  const daily = interval === "D"
  let candles = cleanCandles(
    rows.map((line) => {
      const p = line.split(",")
      const stamp = p[0]
      const open = num(p[1]) ?? 0
      const close = num(p[2]) ?? 0
      const high = num(p[3]) ?? 0
      const low = num(p[4]) ?? 0
      const volume = num(p[5]) ?? 0
      return {
        time: daily || !stamp.includes(" ") ? stamp.slice(0, 10) : zonedNaiveToUnix(stamp, tz),
        open,
        high,
        low,
        close,
        volume,
      }
    })
  )
  if (aggregate) candles = aggregateCandles(candles, aggregate)
  if (!candles.length) throw new Error("eastmoney parsed empty")

  const instrument = finalizeInstrument({
    ...inst,
    symbol: json.data?.code?.toUpperCase() || inst.symbol,
    name: json.data?.name || inst.name,
  })
  return {
    instrument,
    interval,
    source: "eastmoney",
    candles,
    quote: quoteFromCandles(candles),
    precision: json.data?.decimal && json.data.decimal > 0 ? Math.min(json.data.decimal, 4) : 2,
  }
}

async function klinesYahoo(inst: Instrument, interval: ChartInterval): Promise<KlinePayload> {
  const yahoo = inst.yahoo || inst.symbol
  const spec = yahooRange(interval)
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}` +
    `?interval=${spec.interval}&range=${spec.range}&includePrePost=false&events=div%2Csplit`
  const json = await fetchDirectJson<YahooChart>(url)
  const result = json.chart?.result?.[0]
  if (!result?.timestamp?.length) {
    throw new Error(json.chart?.error?.description || `yahoo empty ${yahoo}`)
  }
  const q = result.indicators?.quote?.[0]
  const tz = result.meta?.exchangeTimezoneName || inst.timeZone || "America/New_York"
  const daily = interval === "D"
  let candles = cleanCandles(
    result.timestamp.map((ts, i) => ({
      time: daily ? toBusinessDay(ts, tz) : ts,
      open: q?.open?.[i] ?? NaN,
      high: q?.high?.[i] ?? NaN,
      low: q?.low?.[i] ?? NaN,
      close: q?.close?.[i] ?? NaN,
      volume: q?.volume?.[i] ?? 0,
    }))
  )
  if (spec.aggregate) candles = aggregateCandles(candles, spec.aggregate)
  if (!candles.length) throw new Error("yahoo parsed empty")

  const instrument = finalizeInstrument({
    ...inst,
    symbol: result.meta?.symbol || inst.symbol,
    name: inst.name,
    nameEn: result.meta?.shortName || result.meta?.longName || inst.nameEn,
    market: result.meta?.exchangeName || inst.market,
    yahoo,
    timeZone: tz,
  })
  const metaPrice = num(result.meta?.regularMarketPrice)
  const metaPct = num(result.meta?.regularMarketChangePercent)
  let quote = quoteFromCandles(candles, result.meta?.currency, metaPrice ?? undefined)
  if (metaPrice != null && metaPct != null) {
    const previous = metaPrice / (1 + metaPct / 100)
    quote = {
      ...quote,
      price: metaPrice,
      previous,
      change: metaPrice - previous,
      changePct: metaPct,
    }
  }
  return {
    instrument,
    interval,
    source: "yahoo",
    candles,
    quote,
    precision: quote.price < 5 ? 4 : quote.price < 50 ? 3 : 2,
  }
}

export async function loadKlines(input: {
  symbol?: string
  secid?: string
  yahoo?: string
  market?: string
  name?: string
  nameEn?: string
  tv?: string
  timeZone?: string
  interval: ChartInterval
}): Promise<KlinePayload> {
  const preset = input.symbol ? resolveInstrument(input.symbol) : undefined
  const inst = finalizeInstrument({
    symbol: (input.symbol || preset?.symbol || input.yahoo || "NVDA").toUpperCase(),
    name: input.name || preset?.name || input.symbol || "NVDA",
    nameEn: input.nameEn || preset?.nameEn || input.symbol || "NVDA",
    market: input.market || preset?.market || "",
    secid: input.secid || preset?.secid,
    yahoo: input.yahoo || preset?.yahoo,
    tv: input.tv || preset?.tv,
    timeZone: input.timeZone || preset?.timeZone,
  })

  const retry = async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn()
    } catch {
      return await fn()
    }
  }

  const tasks: Promise<KlinePayload>[] = []
  if (inst.secid) tasks.push(retry(() => klinesEastmoney(inst, input.interval)))
  tasks.push(retry(() => klinesYahoo(inst, input.interval)))

  const errors: string[] = []
  return await new Promise<KlinePayload>((resolve, reject) => {
    let left = tasks.length
    for (const task of tasks) {
      task.then(resolve, (e) => {
        const msg = e instanceof Error ? e.message : String(e)
        errors.push(msg)
        console.warn("[market] source failed", inst.symbol, msg)
        left -= 1
        if (left === 0) reject(new Error(errors.join(" | ") || "no market source"))
      })
    }
  })
}
