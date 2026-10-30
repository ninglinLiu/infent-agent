"use client"

import { useEffect, useRef, useState } from "react"
import { useDash } from "@/lib/dash-store"
import { useT } from "@/lib/i18n"
import { Crosshair, LineChart, Percent, Wallet } from "lucide-react"

/** Animated counter + flash-on-change value */
function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number
  format: (v: number) => string
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const [flash, setFlash] = useState<"up" | "down" | null>(null)

  useEffect(() => {
    if (value === prev.current) return
    const from = prev.current
    const to = value
    setFlash(to >= from ? "up" : "down")
    const start = performance.now()
    const dur = 700
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const to2 = setTimeout(() => setFlash(null), 900)
    prev.current = value
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(to2)
    }
  }, [value])

  return (
    <span className={`tabular ${className ?? ""} ${flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : ""}`}>
      {format(display)}
    </span>
  )
}

type CardProps = {
  label: string
  value: number
  format: (v: number) => string
  delta?: string
  tone?: "up" | "down" | "info" | "neutral"
  icon: React.ComponentType<{ className?: string }>
  sub?: string
}

function MetricCard({ label, value, format, delta, tone = "neutral", icon: Icon, sub }: CardProps) {
  const toneClass =
    tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "info" ? "text-info" : "text-[var(--fg-0)]"
  return (
    <div className="surface px-4 py-3 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-dim uppercase tracking-wider">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${toneClass}`} />
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <AnimatedNumber value={value} format={format} className={`text-xl font-display font-semibold ${toneClass}`} />
        {delta && (
          <span className={`text-[11px] font-mono-ui ${toneClass}`}>
            {delta}
          </span>
        )}
      </div>
      {sub && <div className="text-[10px] text-ghost mt-0.5">{sub}</div>}
      {/* Mini sparkline (decorative) */}
      <svg viewBox="0 0 120 28" className="absolute right-3 bottom-2 w-20 h-6 opacity-70">
        <polyline
          fill="none"
          stroke={tone === "down" ? "#ff3b5c" : tone === "info" ? "#956bd0" : "#428c88"}
          strokeWidth="1.3"
          points="0,20 12,17 24,18 36,12 48,14 60,8 72,10 84,6 96,9 108,4 120,6"
        />
      </svg>
    </div>
  )
}

export function MetricCards() {
  const { metrics } = useDash()
  const t = useT()
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      <MetricCard
        label={t("metric.nav")}
        value={metrics.nav}
        format={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        delta={`+${(metrics.pnlDayPct * 100).toFixed(2)}%`}
        tone="up"
        icon={Wallet}
        sub={t("metric.nav.sub")}
      />
      <MetricCard
        label={t("metric.pnl")}
        value={metrics.pnlDay}
        format={(v) => `${v >= 0 ? "+" : ""}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        delta={`${(metrics.pnlDayPct * 100).toFixed(2)}%`}
        tone={metrics.pnlDay >= 0 ? "up" : "down"}
        icon={LineChart}
        sub={t("metric.pnl.sub")}
      />
      <MetricCard
        label={t("metric.sharpe")}
        value={metrics.sharpe}
        format={(v) => v.toFixed(2)}
        delta={t("metric.sharpe.delta")}
        tone="info"
        icon={Crosshair}
        sub={t("metric.sharpe.sub")}
      />
      <MetricCard
        label={t("metric.win")}
        value={metrics.winRate * 100}
        format={(v) => `${v.toFixed(1)}%`}
        delta={t("metric.win.delta")}
        tone="info"
        icon={Percent}
        sub={t("metric.win.sub")}
      />
    </div>
  )
}
