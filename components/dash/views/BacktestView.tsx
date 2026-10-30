"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { STRATEGIES } from "@/lib/mock/agent"
import { makeCandles } from "@/lib/mock/market"
import { useDash } from "@/lib/dash-store"
import { useLang } from "@/lib/i18n"
import { FlaskConical, Play } from "lucide-react"

export function BacktestView() {
  const { lang } = useLang()
  const list = Object.values(STRATEGIES)
  const [selected, setSelected] = useState(list[0].id)
  const strategy = STRATEGIES[selected]
  const { executeStrategy, activeStrategyId } = useDash()

  const equity = useMemo(() => {
    const candles = makeCandles({ seed: 31, count: 180, drift: strategy.expectedReturn / 365, vol: 0.012 })
    let v = 100_000
    const points = candles.map((c, i) => {
      v *= 1 + (c.c - c.o) / c.o
      return { i, v }
    })
    return points
  }, [strategy.expectedReturn])

  const W = 900, H = 260, PL = 40, PR = 10, PT = 14, PB = 22
  const vs = equity.map((p) => p.v)
  const min = Math.min(...vs)
  const max = Math.max(...vs)
  const xStep = (W - PL - PR) / (equity.length - 1)
  const yFn = (v: number) => PT + (H - PT - PB) * (1 - (v - min) / (max - min))

  const finalV = equity[equity.length - 1].v
  const pct = ((finalV - 100_000) / 100_000) * 100
  const maxDD = (() => {
    let peak = -Infinity
    let dd = 0
    for (const p of equity) {
      peak = Math.max(peak, p.v)
      dd = Math.min(dd, (p.v - peak) / peak)
    }
    return dd * 100
  })()

  return (
    <div className="h-full flex gap-2.5 min-h-0">
      {/* Strategy list */}
      <div className="w-72 shrink-0 surface flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-[var(--line-1)] flex items-center gap-2">
          <FlaskConical className="h-3.5 w-3.5 text-info" />
          <span className="text-[11px] uppercase tracking-wider text-dim">Strategy library</span>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll p-2 space-y-1">
          {list.map((s) => {
            const active = selected === s.id
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`w-full text-left rounded-md p-2.5 transition border ${
                  active
                    ? "border-[rgba(0,255,159,0.4)] bg-[rgba(0,255,159,0.06)]"
                    : "border-transparent hover:bg-[var(--bg-3)]"
                }`}
              >
                <div className="text-[12.5px] font-display font-semibold leading-snug">
                  {lang === "en" ? s.nameEn : s.name}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-dim">{lang === "en" ? s.horizonEn : s.horizon}</span>
                  <span className="text-up font-mono-ui text-[11px] tabular">
                    +{(s.expectedReturn * 100).toFixed(1)}%
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Equity curve + metrics */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5 min-h-0">
        <div className="surface px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold">{lang === "en" ? strategy.nameEn : strategy.name}</div>
            <div className="text-[12px] text-dim mt-0.5">{lang === "en" ? strategy.thesisEn : strategy.thesis}</div>
          </div>
          <button
            onClick={() => executeStrategy(strategy.id)}
            disabled={activeStrategyId === strategy.id}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[12.5px] font-semibold bg-up text-black hover:brightness-110 disabled:opacity-60"
          >
            <Play className="h-3.5 w-3.5" />
            {activeStrategyId === strategy.id ? "Executing…" : "Execute live"}
          </button>
        </div>

        <div className="surface p-4 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-dim">Equity curve · 180d backtest</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono-ui">
              <span className="text-dim">
                Final <span className={`tabular ${pct >= 0 ? "text-up" : "text-down"}`}>
                  {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                </span>
              </span>
              <span className="text-dim">
                Max DD <span className="tabular text-down">{maxDD.toFixed(2)}%</span>
              </span>
              <span className="text-dim">
                Sharpe <span className="tabular text-info">{(1.2 + strategy.sharpe * 0.9).toFixed(2)}</span>
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full block">
              <defs>
                <linearGradient id="bt-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#428c88" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#428c88" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* grid */}
              {Array.from({ length: 5 }).map((_, i) => {
                const y = PT + ((H - PT - PB) * i) / 4
                return (
                  <line
                    key={i}
                    x1={PL}
                    x2={W - PR}
                    y1={y}
                    y2={y}
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="2 4"
                  />
                )
              })}
              <polygon
                fill="url(#bt-fill)"
                points={[
                  `${PL},${H - PB}`,
                  ...equity.map((p, i) => `${PL + i * xStep},${yFn(p.v)}`),
                  `${PL + (equity.length - 1) * xStep},${H - PB}`,
                ].join(" ")}
              />
              <polyline
                fill="none"
                stroke="#428c88"
                strokeWidth="1.4"
                points={equity.map((p, i) => `${PL + i * xStep},${yFn(p.v)}`).join(" ")}
              />
              {/* benchmark (SPY-ish flat line) */}
              <line
                x1={PL}
                x2={W - PR}
                y1={yFn(100_000 * 1.06)}
                y2={yFn(100_000 * 1.06)}
                stroke="#956bd0"
                strokeDasharray="4 4"
                strokeWidth="1"
                opacity="0.7"
              />
              <text x={W - PR - 60} y={yFn(100_000 * 1.06) - 6} fill="#956bd0" fontSize="10">
                Benchmark +6%
              </text>
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Stat k="Win rate" v={`${Math.round(strategy.winRate * 100)}%`} tone="up" />
          <Stat k="Trades" v={`${12 + strategy.actions.length * 4}`} tone="info" />
          <Stat k="Drawdown" v={`${(strategy.drawdown * 100).toFixed(1)}%`} tone="down" />
        </div>
      </div>
    </div>
  )
}

function Stat({ k, v, tone }: { k: string; v: string; tone: "up" | "down" | "info" }) {
  const c = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-info"
  return (
    <motion.div layout className="surface px-4 py-3">
      <div className="text-[10px] text-ghost uppercase tracking-wider">{k}</div>
      <div className={`tabular mt-1 text-xl font-display font-semibold ${c}`}>{v}</div>
    </motion.div>
  )
}
