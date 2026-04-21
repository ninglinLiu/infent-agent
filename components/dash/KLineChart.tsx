"use client"

import { useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { makeCandles, makeForecastBand } from "@/lib/mock/market"
import { useDash } from "@/lib/dash-store"
import { useT } from "@/lib/i18n"
import { ArrowDown, ArrowUp, Maximize2, Sparkles } from "lucide-react"

const CANDLES = makeCandles({ seed: 11, count: 120 })
const BAND = makeForecastBand(CANDLES[CANDLES.length - 1], 32, 0.0018, 23)

type Candle = (typeof CANDLES)[number]

const W = 1000
const H = 340
const PAD_L = 40
const PAD_R = 56
const PAD_T = 20
const PAD_B = 28

function useScales(candles: Candle[], band: typeof BAND) {
  return useMemo(() => {
    const all = candles
      .map((c) => [c.l, c.h])
      .flat()
      .concat(band.map((b) => b.upper))
      .concat(band.map((b) => b.lower))
    const min = Math.min(...all)
    const max = Math.max(...all)
    const pad = (max - min) * 0.08
    const yMin = min - pad
    const yMax = max + pad
    const total = candles.length + band.length
    const plotW = W - PAD_L - PAD_R
    const plotH = H - PAD_T - PAD_B
    const xStep = plotW / (total - 1)
    const x = (i: number) => PAD_L + i * xStep
    const y = (v: number) => PAD_T + plotH - ((v - yMin) / (yMax - yMin)) * plotH
    return { x, y, xStep, yMin, yMax, plotH, plotW }
  }, [candles, band])
}

export function KLineChart() {
  const { marks, metrics } = useDash()
  const t = useT()
  const scales = useScales(CANDLES, BAND)
  const last = CANDLES[CANDLES.length - 1]
  const prev = CANDLES[CANDLES.length - 2]
  const dayChg = ((last.c - prev.c) / prev.c) * 100

  const priceGrid = useMemo(() => {
    const ticks: number[] = []
    const step = (scales.yMax - scales.yMin) / 5
    for (let i = 0; i <= 5; i++) ticks.push(scales.yMin + i * step)
    return ticks
  }, [scales])

  return (
    <div className="relative surface hud-frame overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-semibold tracking-wide">NVDA</span>
              <span className="text-xs text-dim">NVIDIA Corp · NASDAQ</span>
              <span className="chip info">
                <Sparkles className="h-2.5 w-2.5" /> {t("kline.loaded")}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-0.5">
              <span className="tabular text-2xl font-display font-semibold">
                {last.c.toFixed(2)}
              </span>
              <span className={`tabular text-sm font-mono-ui ${dayChg >= 0 ? "text-up" : "text-down"}`}>
                {dayChg >= 0 ? "+" : ""}
                {(last.c - prev.c).toFixed(2)} ({dayChg >= 0 ? "+" : ""}
                {dayChg.toFixed(2)}%)
              </span>
              <span className="text-[10px] text-ghost uppercase tracking-wider">1H · 120 bars · AI band 32</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
            <button
              key={tf}
              className={`px-2 py-1 text-[11px] rounded border border-transparent hover:border-[var(--line-2)] ${
                tf === "1H" ? "bg-[var(--bg-3)] text-up border-[rgba(0,255,159,0.3)]" : "text-dim"
              }`}
            >
              {tf}
            </button>
          ))}
          <button className="ml-2 p-1.5 rounded border border-transparent hover:border-[var(--line-2)] text-dim">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[340px] block">
          <defs>
            <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff9f" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#00ff9f" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="bandLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#58c7ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#58c7ff" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* y grid */}
          {priceGrid.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={scales.y(v)}
                y2={scales.y(v)}
                stroke="rgba(255,255,255,0.045)"
                strokeDasharray="2 4"
              />
              <text
                x={W - PAD_R + 6}
                y={scales.y(v) + 3}
                fontSize="10"
                fill="#6b7687"
                className="font-mono-ui"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Candles */}
          {CANDLES.map((c, i) => {
            const x = scales.x(i)
            const up = c.c >= c.o
            const color = up ? "#00ff9f" : "#ff3b5c"
            const bodyTop = scales.y(Math.max(c.o, c.c))
            const bodyBot = scales.y(Math.min(c.o, c.c))
            const bodyH = Math.max(1, bodyBot - bodyTop)
            const bodyW = Math.max(2, scales.xStep * 0.62)
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={scales.y(c.h)} y2={scales.y(c.l)} stroke={color} strokeWidth={1} opacity={0.85} />
                <rect
                  x={x - bodyW / 2}
                  y={bodyTop}
                  width={bodyW}
                  height={bodyH}
                  fill={up ? color : "#ff3b5c"}
                  fillOpacity={up ? 0.9 : 1}
                  stroke={color}
                  strokeOpacity={0.9}
                />
              </g>
            )
          })}

          {/* Forecast band (fill between upper and lower) */}
          {BAND.length > 0 && (
            <>
              <polygon
                fill="url(#bandFill)"
                points={(() => {
                  const offset = CANDLES.length
                  const upper = BAND.map((b, i) => `${scales.x(offset + i)},${scales.y(b.upper)}`).join(" ")
                  const lower = BAND.slice()
                    .reverse()
                    .map((b, i) => `${scales.x(offset + (BAND.length - 1 - i))},${scales.y(b.lower)}`)
                    .join(" ")
                  return upper + " " + lower
                })()}
              />
              <polyline
                fill="none"
                stroke="url(#bandLine)"
                strokeWidth={1.4}
                strokeDasharray="4 3"
                points={BAND.map((b, i) => `${scales.x(CANDLES.length + i)},${scales.y(b.mid)}`).join(" ")}
              />
              <text
                x={scales.x(CANDLES.length) + 6}
                y={scales.y(BAND[0].upper) - 4}
                fontSize="10"
                fill="#58c7ff"
                className="font-mono-ui"
              >
                {t("kline.band")}
              </text>
            </>
          )}

          {/* Divider between real / forecast */}
          <line
            x1={scales.x(CANDLES.length - 1)}
            x2={scales.x(CANDLES.length - 1)}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="rgba(88,199,255,0.4)"
            strokeDasharray="3 3"
          />

          {/* Execution marks */}
          <AnimatePresence>
            {marks.map((m) => {
              const idx = Math.floor((CANDLES.length + BAND.length) * m.idxRatio)
              const x = scales.x(idx)
              const y = scales.y(
                idx < CANDLES.length ? CANDLES[idx].c : BAND[idx - CANDLES.length].mid
              )
              const color = m.kind === "buy" ? "#00ff9f" : "#ff3b5c"
              return (
                <motion.g
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <line x1={x} x2={x} y1={y - 18} y2={y + 18} stroke={color} strokeWidth={1.2} strokeDasharray="2 2" opacity={0.6} />
                  <circle cx={x} cy={y} r={6} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.2} filter="url(#glow)" />
                  <circle cx={x} cy={y} r={2.2} fill={color} />
                  <g transform={`translate(${x + 8}, ${y - (m.kind === "buy" ? 14 : -6)})`}>
                    <rect width="84" height="18" rx="3" fill="rgba(10,12,16,0.85)" stroke={color} strokeOpacity="0.5" />
                    <text x="8" y="12" fontSize="10" fill={color} className="font-mono-ui">
                      {m.label}
                    </text>
                  </g>
                </motion.g>
              )
            })}
          </AnimatePresence>
        </svg>

        {/* Floating stats */}
        <div className="absolute top-3 right-3 surface-raised px-2.5 py-1.5 text-[10px] space-y-0.5">
          <div className="flex justify-between gap-4 text-dim">
            <span>RSI(14)</span><span className="tabular text-[var(--fg-0)]">62.4</span>
          </div>
          <div className="flex justify-between gap-4 text-dim">
            <span>MACD</span><span className="tabular text-up">+1.82</span>
          </div>
          <div className="flex justify-between gap-4 text-dim">
            <span>VOL</span><span className="tabular text-[var(--fg-0)]">
              {(last.v / 1000).toFixed(0)}K
            </span>
          </div>
          <div className="flex justify-between gap-4 text-dim">
            <span>{t("kline.ai.win")}</span><span className="tabular text-info">
              {Math.round(metrics.winRate * 100)}%
            </span>
          </div>
        </div>

        {/* Bottom legend */}
        <div className="absolute bottom-2 left-4 flex gap-4 text-[10px]">
          <span className="inline-flex items-center gap-1 text-dim">
            <span className="inline-block w-3 h-1.5 bg-up rounded-sm" /> {t("kline.legend.history")}
          </span>
          <span className="inline-flex items-center gap-1 text-dim">
            <span className="inline-block w-3 h-1.5 rounded-sm" style={{ background: "#58c7ff" }} />{" "}
            {t("kline.legend.forecast")}
          </span>
          <span className="inline-flex items-center gap-1 text-dim">
            <ArrowUp className="h-2.5 w-2.5 text-up" /> {t("kline.legend.buy")}
            <ArrowDown className="h-2.5 w-2.5 text-down ml-2" /> {t("kline.legend.sell")}
          </span>
        </div>
      </div>
    </div>
  )
}
