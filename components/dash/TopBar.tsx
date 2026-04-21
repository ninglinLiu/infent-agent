"use client"

import { useDash } from "@/lib/dash-store"
import { TOP_TICKERS } from "@/lib/mock/market"
import { BRAND } from "@/lib/brand"
import { useLang } from "@/lib/i18n"
import { Activity, Circle, Command, Languages, Moon, RotateCcw, Sun } from "lucide-react"

function TickerRow() {
  const items = [...TOP_TICKERS, ...TOP_TICKERS]
  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[var(--bg-1)] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--bg-1)] to-transparent z-10" />
      <div className="marquee-track flex items-center gap-6 whitespace-nowrap py-1">
        {items.map((row, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="text-dim font-mono-ui">{row.sym}</span>
            <span className="tabular text-[var(--fg-0)]">{row.px.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span className={`tabular font-mono-ui ${row.chg >= 0 ? "text-up" : "text-down"}`}>
              {row.chg >= 0 ? "+" : ""}
              {row.chg.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TopBar() {
  const { theme, setTheme, resetAll } = useDash()
  const { lang, setLang, t } = useLang()
  return (
    <header className="h-12 shrink-0 border-b border-[var(--line-1)] bg-[var(--bg-1)]/80 backdrop-blur-md flex items-center gap-4 px-4">
      <div className="flex items-center gap-2 w-[360px] shrink-0">
        <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-[#00ff9f] to-[#22d3ee] flex items-center justify-center">
          <span className="font-display text-[13px] font-bold text-black">Ω</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-sm font-semibold tracking-wide">{BRAND.short}</span>
          <span
            className="text-[10px] text-ghost tracking-[0.12em] truncate"
            title={BRAND.full}
            style={{ maxWidth: 280 }}
          >
            {BRAND.full}
          </span>
        </div>
        <div className="ml-2 chip info">
          <Circle className="h-1.5 w-1.5 fill-current" />
          {t("dash.live")}
        </div>
      </div>

      <TickerRow />

      <div className="flex items-center gap-2 shrink-0">
        <div className="chip">
          <Activity className="h-3 w-3 text-up" />
          NYSE · OPEN
        </div>
        <button
          type="button"
          onClick={() => setLang(lang === "zh" ? "en" : "zh")}
          className="chip hover:bg-[var(--bg-4)] transition"
          title={t("lang.label")}
        >
          <Languages className="h-3 w-3" />
          {lang === "zh" ? "EN" : "中文"}
        </button>
        <button
          onClick={resetAll}
          className="chip hover:bg-[var(--bg-4)] transition"
          title={t("topbar.reset")}
        >
          <RotateCcw className="h-3 w-3" /> {t("topbar.resetBtn")}
        </button>
        <button
          onClick={() => {
            const next = theme === "dark" ? "light" : "dark"
            setTheme(next)
            if (typeof document !== "undefined") {
              document.documentElement.classList.toggle("light", next === "light")
            }
          }}
          className="chip hover:bg-[var(--bg-4)] transition"
          title={t("topbar.theme")}
        >
          {theme === "dark" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
          {theme === "dark" ? "Dark" : "Light"}
        </button>
        <div className="chip">
          <Command className="h-3 w-3" /> K
        </div>
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#2a2f3a] to-[#131620] border border-[var(--line-2)] flex items-center justify-center text-[11px] font-semibold">
          YU
        </div>
      </div>
    </header>
  )
}
