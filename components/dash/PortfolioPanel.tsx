"use client"

import { useDash } from "@/lib/dash-store"
import { useLang, useT } from "@/lib/i18n"
import { motion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, Layers } from "lucide-react"

export function PortfolioPanel() {
  const { holdings, selectSymbol, chartInstrument } = useDash()
  const { lang } = useLang()
  const t = useT()

  return (
    <div className="surface px-4 py-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-info" />
          <span className="text-[11px] uppercase tracking-wider text-dim">{t("portfolio.title")}</span>
        </div>
        <span className="text-[10px] text-ghost">
          {holdings.length} {t("portfolio.count")}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll -mx-2 px-2">
        <table className="w-full text-xs">
          <thead className="text-[10px] text-ghost uppercase tracking-wider">
            <tr>
              <th className="text-left py-1.5">{t("portfolio.col.symbol")}</th>
              <th className="text-right">{t("portfolio.col.qty")}</th>
              <th className="text-right">{t("portfolio.col.last")}</th>
              <th className="text-right">{t("portfolio.col.weight")}</th>
              <th className="text-right">{t("portfolio.col.today")}</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const up = h.chg >= 0
              return (
                <motion.tr
                  key={h.symbol}
                  layout
                  onClick={() => h.symbol !== "CASH" && selectSymbol(h.symbol)}
                  className={`border-t border-[var(--line-1)] transition ${
                    h.symbol === "CASH"
                      ? ""
                      : "cursor-pointer hover:bg-[var(--bg-3)]"
                  } ${chartInstrument.symbol === h.symbol ? "bg-[rgba(0,255,159,0.05)]" : ""}`}
                >
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-5 w-5 rounded flex items-center justify-center text-[9px] font-mono-ui font-bold"
                        style={{
                          background: "var(--bg-3)",
                          border: `1px solid ${up ? "rgba(0,255,159,0.3)" : "rgba(255,59,92,0.3)"}`,
                          color: up ? "#00ff9f" : "#ff3b5c",
                        }}
                      >
                        {h.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-mono-ui">{h.symbol}</div>
                        <div className="text-[10px] text-ghost">{lang === "en" ? h.nameEn : h.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right tabular font-mono-ui">{h.qty}</td>
                  <td className="text-right tabular">${h.last.toFixed(2)}</td>
                  <td className="text-right">
                    <motion.div
                      key={h.weight}
                      className="inline-flex items-center justify-end w-24"
                    >
                      <div className="flex-1 h-1 bg-[var(--bg-3)] rounded-full overflow-hidden mr-1.5">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#00ff9f] to-[#58c7ff]"
                          animate={{ width: `${h.weight * 100 * 2.5}%` }}
                          transition={{ type: "spring", stiffness: 80, damping: 16 }}
                          style={{ maxWidth: "100%" }}
                        />
                      </div>
                      <span className="tabular text-[10px] text-dim w-8 text-right">
                        {Math.round(h.weight * 100)}%
                      </span>
                    </motion.div>
                  </td>
                  <td className={`text-right tabular font-mono-ui ${up ? "text-up" : "text-down"}`}>
                    <div className="inline-flex items-center gap-0.5">
                      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {up ? "+" : ""}
                      {h.chg.toFixed(2)}%
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
