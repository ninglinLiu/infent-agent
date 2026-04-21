"use client"

import { useDash } from "@/lib/dash-store"
import { useLang, type DictKey } from "@/lib/i18n"
import { AnimatePresence, motion } from "framer-motion"
import { Activity, CheckCircle2, CircleDot, Zap } from "lucide-react"

function actionLabel(a: any, t: (k: DictKey) => string) {
  if (a.kind === "alloc") return `${t("timeline.action.alloc")} ${a.symbol} → ${Math.round(a.target * 100)}%`
  if (a.kind === "buy") return `${t("timeline.action.buy")} ${a.symbol} · +${Math.round(a.qtyPct * 100)}%`
  if (a.kind === "sell") return `${t("timeline.action.sell")} ${a.symbol} · -${Math.round(a.qtyPct * 100)}%`
  if (a.kind === "hold") return `${t("timeline.action.hold")} ${a.symbol}${a.note ? " · " + a.note : ""}`
  return ""
}

export function StrategyTimeline() {
  const { runs, activeStrategyId } = useDash()
  const { lang, t } = useLang()
  const current = runs[runs.length - 1]
  const strat = current?.strategy
  const displayName = strat ? (lang === "en" ? strat.nameEn : strat.name) : ""
  const displayThesis = strat ? (lang === "en" ? strat.thesisEn : strat.thesis) : ""
  const displayHorizon = strat ? (lang === "en" ? strat.horizonEn : strat.horizon) : ""

  return (
    <div className="surface px-4 py-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-up" />
          <span className="text-[11px] uppercase tracking-wider text-dim">{t("timeline.title")}</span>
        </div>
        {activeStrategyId && (
          <span className="chip info">
            <Activity className="h-2.5 w-2.5" /> {t("timeline.running")}
          </span>
        )}
      </div>

      {!current ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <div className="relative h-10 w-10 rounded-full border border-dashed border-[var(--line-2)] flex items-center justify-center">
            <Zap className="h-4 w-4 text-dim" />
          </div>
          <div className="mt-3 text-xs text-dim">{t("timeline.empty.t")}</div>
          <div className="text-[11px] text-ghost mt-1 max-w-[260px]">{t("timeline.empty.sub")}</div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="text-sm font-display font-semibold">{displayName}</div>
              <div className="text-[11px] text-dim">{displayThesis}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] text-ghost">{t("timeline.expected")}</div>
              <div className="text-up font-mono-ui text-sm tabular">
                +{(current.strategy.expectedReturn * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="h-1 rounded-full bg-[var(--bg-3)] overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-[#00ff9f] via-[#58c7ff] to-[#00ff9f] bg-[length:200%_100%] animate-shimmer"
              initial={{ width: 0 }}
              animate={{ width: `${(current.step / current.strategy.actions.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 70, damping: 18 }}
            />
          </div>

          <div className="space-y-1.5 overflow-y-auto thin-scroll pr-1">
            <AnimatePresence initial={false}>
              {current.strategy.actions.map((a, i) => {
                const done = i < current.step
                const active = i === current.step && !current.finishedAt
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs ${
                      done
                        ? "border-[rgba(0,255,159,0.25)] bg-[rgba(0,255,159,0.05)]"
                        : active
                          ? "border-[rgba(88,199,255,0.4)] bg-[rgba(88,199,255,0.06)] ring-info"
                          : "border-[var(--line-1)] bg-[var(--bg-2)]"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-up shrink-0" />
                    ) : active ? (
                      <CircleDot className="h-3.5 w-3.5 text-info animate-pulse shrink-0" />
                    ) : (
                      <CircleDot className="h-3.5 w-3.5 text-[var(--fg-3)] shrink-0" />
                    )}
                    <span className={done ? "text-[var(--fg-0)]" : active ? "text-info" : "text-dim"}>
                      {actionLabel(a, t)}
                    </span>
                    <span className="ml-auto text-[10px] text-ghost font-mono-ui">
                      {done ? "DONE" : active ? "EXEC" : "PENDING"}
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
            <div className="surface-raised px-2 py-1.5">
              <div className="text-ghost">{t("timeline.drawdown")}</div>
              <div className="tabular text-down">{(current.strategy.drawdown * 100).toFixed(1)}%</div>
            </div>
            <div className="surface-raised px-2 py-1.5">
              <div className="text-ghost">{t("timeline.winrate")}</div>
              <div className="tabular text-up">{(current.strategy.winRate * 100).toFixed(0)}%</div>
            </div>
            <div className="surface-raised px-2 py-1.5">
              <div className="text-ghost">{t("timeline.horizon")}</div>
              <div className="tabular text-[var(--fg-0)]">{displayHorizon}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
