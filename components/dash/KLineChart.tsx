"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts"
import type {
  CandlestickData,
  HistogramData,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  MouseEventParams,
  Time,
} from "lightweight-charts"
import { ArrowDown, ArrowUp, Loader2, Maximize2, Minimize2, Search } from "lucide-react"
import { useDash } from "@/lib/dash-store"
import { useLang, useT } from "@/lib/i18n"
import { PRESET_LIST, displayName, filterPresets, tradingViewUrl } from "@/lib/market/presets"
import type { ChartInterval, Instrument, KlinePayload } from "@/lib/market/types"
import { INTERVALS } from "@/lib/market/types"
import { visibleFrom } from "@/lib/market/overlay"
import { useLiveMarket } from "@/lib/market/live"
import { findAsset } from "@/lib/market/universe"
import { useSandbox } from "@/lib/sandbox/client"
import type { SandboxOrderRow } from "@/lib/sandbox/types"
import { useAccount } from "@/components/account/AccountProvider"
import { FlashNumber } from "@/components/terminal/primitives"

type HoverBar = {
  time: Time
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

type ChartApi = {
  chart: IChartApi
  candles: ISeriesApi<"Candlestick">
  volume: ISeriesApi<"Histogram">
  markers: ISeriesMarkersPluginApi<Time>
}

const INTERVAL_SECONDS: Record<ChartInterval, number> = { "1": 60, "5": 300, "15": 900, "60": 3600, "240": 14400, D: 86400 }

function localDate(ms: number, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms))
}

/** 某个时刻落在哪根 K 线上：日线按交易所当地日期，分钟线取不晚于该时刻的最后一根 */
function barTimeAt(bars: KlinePayload["candles"], ms: number, tz: string): Time | null {
  if (!bars.length) return null
  if (typeof bars[0].time === "string") {
    const day = localDate(ms, tz)
    const hit = [...bars].reverse().find(b => String(b.time) <= day)
    return (hit?.time ?? null) as Time | null
  }
  const seconds = ms / 1000
  const hit = [...bars].reverse().find(b => Number(b.time) <= seconds)
  return (hit?.time ?? null) as Time | null
}

function fmtPrice(n: number, precision: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}

function fmtVol(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return `${Math.round(v)}`
}

function fmtTime(time: Time, lang: "zh" | "en") {
  if (typeof time === "string") return time
  if (typeof time === "object") {
    const m = String(time.month).padStart(2, "0")
    const d = String(time.day).padStart(2, "0")
    return `${time.year}-${m}-${d}`
  }
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(time * 1000))
}

function paintChart(api: ChartApi, payload: KlinePayload) {
  const candleData: CandlestickData<Time>[] = payload.candles.map((c) => ({
    time: c.time as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }))
  const volumeData: HistogramData<Time>[] = payload.candles.map((c) => ({
    time: c.time as Time,
    value: c.volume,
    color: c.close >= c.open ? "rgba(66,140,136,0.3)" : "rgba(187,112,138,0.3)",
  }))
  api.candles.setData(candleData)
  api.volume.setData(volumeData)

  const range = visibleFrom(payload.candles.length)
  api.chart.timeScale().setVisibleLogicalRange(range)
}

/** 沙箱里的真实成交：按成交时刻落到对应 K 线上 */
function paintFills(api: ChartApi, payload: KlinePayload, fills: SandboxOrderRow[], tz: string) {
  const markers = fills.flatMap(fill => {
    const time = barTimeAt(payload.candles, Date.parse(fill.created_at), tz)
    if (time === null) return []
    return [{
      time,
      position: fill.side === "buy" ? "belowBar" as const : "aboveBar" as const,
      color: fill.side === "buy" ? "#4fd1b5" : "#f07a9b",
      shape: fill.side === "buy" ? "arrowUp" as const : "arrowDown" as const,
      text: `${fill.side === "buy" ? "BUY" : "SELL"} ${fill.qty} @ ${fill.fill_price.toFixed(2)}`,
      size: 1.4,
    }]
  }).sort((a, b) => String(a.time).localeCompare(String(b.time), undefined, { numeric: true }))
  api.markers.setMarkers(markers)
}

export function KLineChart() {
  const {
    theme,
    chartInstrument,
    chartInterval,
    setChartInstrument,
    setChartInterval,
  } = useDash()
  const { lang } = useLang()
  const t = useT()
  const live = useLiveMarket()
  const { user } = useAccount()
  const { portfolio } = useSandbox(user?.id)
  // 图表品种若在行情白名单里，最后一根 K 线跟随实时报价跳动
  const asset = findAsset(chartInstrument.symbol) ?? (chartInstrument.yahoo ? findAsset(chartInstrument.yahoo) : undefined)
  const liveQuote = asset ? live.quotes[asset.symbol] : undefined
  const fills = useMemo(() => (portfolio?.orders ?? []).filter(o => asset && o.symbol === asset.symbol), [portfolio?.orders, asset])

  const [query, setQuery] = useState(chartInstrument.symbol)
  const [searchOpen, setSearchOpen] = useState(false)
  const [results, setResults] = useState<Instrument[]>(PRESET_LIST.slice(0, 8))
  const [payload, setPayload] = useState<KlinePayload | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState("")
  const [hover, setHover] = useState<HoverBar | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [reload, setReload] = useState(0)
  const [chartTick, setChartTick] = useState(0)

  const searchWrap = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ChartApi | null>(null)

  useEffect(() => {
    setQuery(chartInstrument.symbol)
    setHover(null)
  }, [chartInstrument.symbol])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!searchWrap.current?.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  useEffect(() => {
    if (!searchOpen) return
    const q = query.trim()
    if (!q || q.toUpperCase() === chartInstrument.symbol.toUpperCase()) {
      setResults(filterPresets(q, 8))
      return
    }
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`)
        const json = (await res.json()) as { items?: Instrument[] }
        setResults(json.items?.length ? json.items : filterPresets(q, 8))
      } catch {
        setResults(filterPresets(q, 8))
      }
    }, 280)
    return () => window.clearTimeout(handle)
  }, [query, searchOpen, chartInstrument.symbol])

  useEffect(() => {
    const ac = new AbortController()
    setStatus("loading")
    setError("")
    const params = new URLSearchParams({
      symbol: chartInstrument.symbol,
      interval: chartInterval,
    })
    if (chartInstrument.secid) params.set("secid", chartInstrument.secid)
    if (chartInstrument.yahoo) params.set("yahoo", chartInstrument.yahoo)
    if (chartInstrument.market) params.set("market", chartInstrument.market)
    if (chartInstrument.name) params.set("name", chartInstrument.name)
    if (chartInstrument.nameEn) params.set("nameEn", chartInstrument.nameEn)
    if (chartInstrument.tv) params.set("tv", chartInstrument.tv)
    if (chartInstrument.timeZone) params.set("tz", chartInstrument.timeZone)

    fetch(`/api/market/klines?${params.toString()}`, { signal: ac.signal })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`)
        return json as KlinePayload
      })
      .then((data) => {
        setPayload(data)
        setStatus("idle")
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return
        setStatus("error")
        setError(e instanceof Error ? e.message : "failed")
      })

    return () => ac.abort()
  }, [chartInstrument, chartInterval, reload])

  const dark = theme === "dark"

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    let disposed = false

    const boot = () => {
      if (disposed || chartRef.current) return
      if (el.clientWidth < 48 || el.clientHeight < 80) return

      const palette = getComputedStyle(el)
      const tone = (name: string) => palette.getPropertyValue(name).trim()
      const chart = createChart(el, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: tone("--fg-2"),
          fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
        },
        grid: {
          vertLines: { color: tone("--line-1") },
          horzLines: { color: tone("--line-1") },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "#956bd0", width: 1, style: LineStyle.Dashed, labelBackgroundColor: tone("--bg-3") },
          horzLine: { color: "#956bd0", width: 1, style: LineStyle.Dashed, labelBackgroundColor: tone("--bg-3") },
        },
        rightPriceScale: {
          borderColor: tone("--line-2"),
          scaleMargins: { top: 0.1, bottom: 0.22 },
        },
        timeScale: {
          borderColor: tone("--line-2"),
          timeVisible: chartInterval !== "D",
          secondsVisible: false,
          rightOffset: 6,
          barSpacing: 9,
          minBarSpacing: 4,
        },
        localization: { locale: lang === "zh" ? "zh-CN" : "en-US" },
      })

      // 深色终端里用更亮的涨跌色，浅色页面沿用原来的青绿/灰玫红
      const up = tone("--chart-up") || "#428c88"
      const down = tone("--chart-down") || "#bb708a"
      const candles = chart.addSeries(CandlestickSeries, {
        upColor: up,
        downColor: down,
        borderVisible: false,
        wickUpColor: up,
        wickDownColor: down,
      })
      const volume = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
      })
      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
        visible: false,
      })
      const markers = createSeriesMarkers(candles, [])

      const onMove = (param: MouseEventParams<Time>) => {
        if (param.time === undefined) {
          setHover(null)
          return
        }
        const bar = param.seriesData.get(candles) as CandlestickData<Time> | undefined
        const vol = param.seriesData.get(volume) as HistogramData<Time> | undefined
        if (!bar || !("open" in bar)) {
          setHover(null)
          return
        }
        setHover({
          time: param.time,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: vol && "value" in vol ? vol.value : undefined,
        })
      }
      chart.subscribeCrosshairMove(onMove)
      chartRef.current = { chart, candles, volume, markers }
      setChartTick((n) => n + 1)

      return () => {
        chart.unsubscribeCrosshairMove(onMove)
      }
    }

    let unsubMove: (() => void) | undefined
    const tryBoot = () => {
      const cleanup = boot()
      if (cleanup) unsubMove = cleanup
    }
    tryBoot()
    const ro = new ResizeObserver(() => {
      tryBoot()
      const api = chartRef.current
      if (api && api.chart.timeScale().getVisibleLogicalRange() == null) {
        const n = api.candles.data().length
        if (n) api.chart.timeScale().setVisibleLogicalRange(visibleFrom(n))
      }
    })
    ro.observe(el)

    return () => {
      disposed = true
      ro.disconnect()
      unsubMove?.()
      chartRef.current?.chart.remove()
      chartRef.current = null
    }
  }, [dark, lang, chartInterval])

  const tz = chartInstrument.timeZone || asset?.tz || "America/New_York"
  useEffect(() => {
    const api = chartRef.current
    if (!api || !payload || payload.interval !== chartInterval) return
    paintChart(api, payload)
  }, [payload, chartInterval, chartTick])

  useEffect(() => {
    const api = chartRef.current
    if (!api || !payload || payload.interval !== chartInterval) return
    paintFills(api, payload, fills, tz)
  }, [payload, chartInterval, chartTick, fills, tz])

  // 实时报价落到当前这根 K 线：同一根则更新收盘/高低，进入新的时间桶则新开一根
  const lastBar = useRef<{ time: Time; open: number; high: number; low: number; close: number } | null>(null)
  useEffect(() => {
    const last = payload?.candles[payload.candles.length - 1]
    lastBar.current = last ? { time: last.time as Time, open: last.open, high: last.high, low: last.low, close: last.close } : null
  }, [payload])
  useEffect(() => {
    const api = chartRef.current
    const bar = lastBar.current
    if (!api || !payload || !bar || !liveQuote || payload.interval !== chartInterval) return
    const at = Date.parse(liveQuote.quotedAt)
    const price = liveQuote.price
    let time: Time
    if (typeof bar.time === "string") {
      const day = localDate(at, tz)
      if (day < bar.time) return
      time = day as Time
    } else {
      const step = INTERVAL_SECONDS[chartInterval]
      const bucket = Math.floor(at / 1000 / step) * step
      if (bucket < Number(bar.time)) return
      time = (bucket > Number(bar.time) + step * 3 ? Number(bar.time) : bucket) as Time
    }
    const next = time === bar.time
      ? { ...bar, close: price, high: Math.max(bar.high, price), low: Math.min(bar.low, price) }
      : { time, open: bar.close, high: Math.max(bar.close, price), low: Math.min(bar.close, price), close: price }
    try { api.candles.update(next); lastBar.current = next } catch { /* 数据源时间轴与报价不一致时忽略 */ }
  }, [liveQuote, payload, chartInterval, tz])

  const pick = useCallback(
    (inst: Instrument) => {
      setChartInstrument(inst)
      setQuery(inst.symbol)
      setSearchOpen(false)
    },
    [setChartInstrument]
  )

  const current =
    payload &&
    (payload.instrument.symbol.toUpperCase() === chartInstrument.symbol.toUpperCase() ||
      (!!chartInstrument.yahoo && payload.instrument.yahoo === chartInstrument.yahoo))
      ? payload
      : null
  // 头部价格优先用 5 秒刷新的实时报价，K 线接口的报价作为后备
  const quote = useMemo(() => current && liveQuote
    ? { ...current.quote, price: liveQuote.price, previous: liveQuote.previousClose ?? current.quote.previous, change: liveQuote.previousClose ? liveQuote.price - liveQuote.previousClose : current.quote.change, changePct: liveQuote.changePct ?? current.quote.changePct }
    : current?.quote, [current, liveQuote])
  const precision = current?.precision ?? 2
  const shown = useMemo(() => hover ?? (quote
    ? {
        time: (payload?.candles.at(-1)?.time ?? "") as Time,
        open: quote.price,
        high: quote.high ?? quote.price,
        low: quote.low ?? quote.price,
        close: quote.price,
        volume: quote.volume,
      }
    : null), [hover, quote, payload])
  const chg = quote?.change ?? 0
  const chgPct = quote?.changePct ?? 0
  const up = chg >= 0

  const ohlc = useMemo(() => {
    if (!shown || !payload) return null
    const ref = hover ? shown.open : quote?.previous ?? shown.open
    return {
      o: shown.open,
      h: shown.high,
      l: shown.low,
      c: shown.close,
      v: shown.volume,
      t: shown.time,
      up: shown.close >= (hover ? shown.open : ref),
    }
  }, [shown, payload, hover, quote])

  return (
    <div
      className={`relative surface hud-frame overflow-hidden flex flex-col ${
        expanded ? "fixed inset-3 z-[80] h-auto" : "h-full min-h-[360px]"
      }`}
    >
      <div className="relative z-20 shrink-0 bg-[var(--bg-2)] px-4 pt-3 pb-2 border-b border-[var(--line-1)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div ref={searchWrap} className="relative shrink-0">
              <div className="flex items-center gap-1.5 surface-raised px-2 py-1">
                <Search className="h-3 w-3 text-ghost shrink-0" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && results[0]) pick(results[0])
                    if (e.key === "Escape") setSearchOpen(false)
                  }}
                  placeholder={t("kline.search.ph")}
                  className="bg-transparent outline-none text-[12px] w-[132px] font-mono-ui"
                  aria-label={t("kline.search")}
                />
              </div>
              {searchOpen && (
                <div className="absolute left-0 top-full mt-1 z-30 w-[320px] max-h-[280px] overflow-y-auto thin-scroll surface-raised shadow-lg">
                  <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-ghost">
                    {t("kline.popular")}
                  </div>
                  {results.length === 0 && (
                    <div className="px-3 py-4 text-[12px] text-ghost">{t("kline.empty")}</div>
                  )}
                  {results.map((inst) => (
                    <button
                      key={`${inst.secid || inst.yahoo || inst.symbol}`}
                      type="button"
                      onClick={() => pick(inst)}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--bg-4)] flex items-center justify-between gap-2"
                    >
                      <span>
                        <span className="font-mono-ui text-[12px]">{inst.symbol}</span>
                        <span className="ml-2 text-[11px] text-dim">{displayName(inst, lang)}</span>
                      </span>
                      <span className="text-[10px] text-ghost font-mono-ui">{inst.market}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-display text-[15px] font-semibold tracking-wide">
                  {chartInstrument.symbol}
                </span>
                <span className="text-[11px] text-dim truncate">
                  {displayName(chartInstrument, lang)} · {chartInstrument.market || "—"}
                </span>
                <span className={`chip shrink-0 ${liveQuote ? "up" : "info"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${liveQuote?.open ? "bg-up animate-pulse" : "bg-[var(--fg-3)]"}`} />
                  {liveQuote ? (liveQuote.open ? (lang === "en" ? "LIVE · 5s" : "实时 · 5 秒") : (lang === "en" ? "CLOSED · last" : "休市 · 最后价")) : t("kline.live")}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <FlashNumber value={quote?.price} flash={asset ? live.flashes[asset.symbol] : undefined} className="tabular text-2xl font-display font-semibold">
                  {quote ? fmtPrice(quote.price, precision) : "—"}
                </FlashNumber>
                {quote && (
                  <span className={`tabular text-sm font-mono-ui ${up ? "text-up" : "text-down"}`}>
                    {up ? "+" : ""}
                    {fmtPrice(chg, precision)} ({up ? "+" : ""}
                    {chgPct.toFixed(2)}%)
                  </span>
                )}
                <span className="text-[10px] text-ghost">
                  {INTERVALS.find((i) => i.id === chartInterval)?.label} · {payload?.candles.length ?? 0} {t("kline.bars")}
                  {payload ? ` · ${payload.source === "eastmoney" ? t("kline.source.eastmoney") : t("kline.source.yahoo")}` : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {INTERVALS.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setChartInterval(tf.id)}
                className={`px-2 py-1 text-[11px] rounded border ${
                  tf.id === chartInterval
                    ? "bg-[var(--bg-3)] text-up border-[rgba(0,255,159,0.3)]"
                    : "text-dim border-transparent hover:border-[var(--line-2)]"
                }`}
              >
                {tf.label}
              </button>
            ))}
            <a
              href={tradingViewUrl(chartInstrument)}
              target="_blank"
              rel="noreferrer"
              className="ml-1 px-2 py-1 text-[11px] rounded border border-transparent hover:border-[var(--line-2)] text-dim"
              title={t("kline.tv")}
            >
              TV
            </a>
            <button
              type="button"
              className="p-1.5 rounded border border-transparent hover:border-[var(--line-2)] text-dim"
              title={expanded ? t("kline.exitfs") : t("kline.fullscreen")}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-0 flex-1 min-h-[280px]">
        <div ref={hostRef} className="absolute inset-0" />

        {status === "loading" && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 chip info z-10">
            <Loader2 className="h-3 w-3 animate-spin" /> {t("kline.loading")}
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 grid place-items-center z-10 bg-[var(--bg-2)]/70">
            <div className="text-center space-y-2">
              <div className="text-sm text-dim">{t("kline.error")}</div>
              <div className="text-[11px] text-ghost font-mono-ui max-w-sm">{error}</div>
              <button type="button" className="chip info" onClick={() => setReload((n) => n + 1)}>
                {t("kline.retry")}
              </button>
            </div>
          </div>
        )}

        {ohlc && payload && (
          <div className="absolute top-2 right-2 surface-raised px-2.5 py-1.5 text-[10px] space-y-0.5 pointer-events-none z-10">
            <div className="text-ghost">{fmtTime(ohlc.t, lang)}</div>
            <div className="flex justify-between gap-4 text-dim">
              <span>O</span>
              <span className="tabular text-[var(--fg-0)]">{fmtPrice(ohlc.o, precision)}</span>
            </div>
            <div className="flex justify-between gap-4 text-dim">
              <span>H</span>
              <span className="tabular text-up">{fmtPrice(ohlc.h, precision)}</span>
            </div>
            <div className="flex justify-between gap-4 text-dim">
              <span>L</span>
              <span className="tabular text-down">{fmtPrice(ohlc.l, precision)}</span>
            </div>
            <div className="flex justify-between gap-4 text-dim">
              <span>C</span>
              <span className={`tabular ${ohlc.up ? "text-up" : "text-down"}`}>{fmtPrice(ohlc.c, precision)}</span>
            </div>
            {ohlc.v != null && (
              <div className="flex justify-between gap-4 text-dim">
                <span>VOL</span>
                <span className="tabular text-[var(--fg-0)]">{fmtVol(ohlc.v)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {fills.length > 0 && (
        <div className="relative z-10 shrink-0 px-4 py-1.5 border-t border-[var(--line-1)] flex items-center gap-2 overflow-x-auto thin-scroll">
          <span className="text-[10px] text-ghost uppercase tracking-wider shrink-0">{lang === "en" ? "Sandbox fills" : "沙箱成交"}</span>
          {fills.slice(0, 8).map((fill) => (
            <span key={fill.id} className={`chip shrink-0 ${fill.side === "buy" ? "up" : "down"}`}>
              {fill.side === "buy" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
              {fill.qty} @ {fmtPrice(fill.fill_price, precision)}
            </span>
          ))}
        </div>
      )}

      <div className="relative z-10 shrink-0 flex items-center justify-between gap-3 px-4 py-1.5 text-[10px] border-t border-[var(--line-1)] bg-[var(--bg-2)]">
        <div className="flex gap-4">
          <span className="inline-flex items-center gap-1 text-dim">
            <span className="inline-block w-3 h-1.5 bg-up rounded-sm" /> {t("kline.legend.history")}
          </span>
          <span className="inline-flex items-center gap-1 text-dim">
            <ArrowUp className="h-2.5 w-2.5 text-up" /> {t("kline.legend.buy")}
            <ArrowDown className="h-2.5 w-2.5 text-down ml-2" /> {t("kline.legend.sell")}
          </span>
        </div>
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
          className="text-ghost hover:text-dim"
        >
          {t("kline.attribution")}
        </a>
      </div>
    </div>
  )
}
