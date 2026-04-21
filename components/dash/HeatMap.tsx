"use client"

import { useDash } from "@/lib/dash-store"
import { useLang, useT } from "@/lib/i18n"
import { motion } from "framer-motion"
import { Flame } from "lucide-react"

// Color for sector tile based on % change
function tone(chg: number) {
  const clamped = Math.max(-4, Math.min(4, chg))
  const t = Math.abs(clamped) / 4
  if (chg >= 0) {
    return {
      bg: `rgba(0, 255, 159, ${0.08 + t * 0.35})`,
      border: `rgba(0, 255, 159, ${0.2 + t * 0.5})`,
      color: "#00ff9f",
    }
  }
  return {
    bg: `rgba(255, 59, 92, ${0.08 + t * 0.35})`,
    border: `rgba(255, 59, 92, ${0.2 + t * 0.5})`,
    color: "#ff3b5c",
  }
}

export function HeatMap() {
  const { sectors } = useDash()
  const { lang } = useLang()
  const t = useT()
  return (
    <div className="surface px-4 py-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-up" />
          <span className="text-[11px] uppercase tracking-wider text-dim">{t("heatmap.title")}</span>
        </div>
        <span className="text-[10px] text-ghost">{t("heatmap.alpha")}</span>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-1.5">
        {sectors.map((s) => {
          const c = tone(s.chg)
          // visual weight: cells with bigger weight are taller
          const rowSpan = s.weight >= 12 ? "row-span-2" : ""
          return (
            <motion.div
              key={s.nameEn + s.name}
              layout
              animate={{ backgroundColor: c.bg, borderColor: c.border }}
              transition={{ type: "spring", stiffness: 80, damping: 16 }}
              className={`relative rounded border px-2 py-1.5 flex flex-col justify-between overflow-hidden ${rowSpan}`}
              style={{ backgroundColor: c.bg, borderColor: c.border }}
            >
              <div className="text-[11px] font-medium text-[var(--fg-0)]">{lang === "en" ? s.nameEn : s.name}</div>
              <div className="flex items-baseline justify-between">
                <span className="tabular font-mono-ui text-sm" style={{ color: c.color }}>
                  {s.chg >= 0 ? "+" : ""}
                  {s.chg.toFixed(2)}%
                </span>
                <span className="text-[9px] text-ghost">{s.weight}%</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
