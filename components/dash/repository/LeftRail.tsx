"use client"

import {
  BarChart3,
  Bot,
  Compass,
  FlaskConical,
  Gauge,
  History,
  LayoutGrid,
  Settings,
  Sparkles,
} from "lucide-react"
import { useView, type ViewId } from "./view-context"
import { useT, useLang, type DictKey } from "@/lib/i18n"

const NAV: { id: ViewId; icon: typeof LayoutGrid; labelKey: DictKey }[] = [
  { id: "workspace", icon: LayoutGrid,   labelKey: "rail.workspace" },
  { id: "agent",     icon: Bot,          labelKey: "rail.agent" },
  { id: "markets",   icon: BarChart3,    labelKey: "rail.markets" },
  { id: "discover",  icon: Compass,      labelKey: "rail.discover" },
  { id: "backtest",  icon: FlaskConical, labelKey: "rail.backtest" },
  { id: "risk",      icon: Gauge,        labelKey: "rail.risk" },
  { id: "journal",   icon: History,      labelKey: "rail.journal" },
  { id: "settings",  icon: Settings,     labelKey: "rail.settings" },
]

export function LeftRail({ onExit }: { onExit: () => void }) {
  const { view, setView } = useView()
  const t = useT()
  const { lang } = useLang()

  return (
    <aside aria-label="Dashboard navigation" className="w-14 shrink-0 border-r border-[var(--line-1)] bg-[var(--bg-1)]/70 flex flex-col items-center py-3 gap-1">
      <button
        onClick={onExit}
        title={lang === "en" ? "Back to the rainy street · Esc" : "返回雨夜街角 · Esc"}
        aria-label={lang === "en" ? "Back to the rainy street" : "返回雨夜街角"}
        className="h-10 w-10 rounded-md flex items-center justify-center bg-gradient-to-br from-[#00ff9f] to-[#22d3ee] hover:brightness-110 transition mb-2"
      >
        <span className="font-display text-sm font-bold text-black">Ω</span>
      </button>

      {NAV.map(({ id, icon: Icon, labelKey }) => {
        const active = view === id
        const label = t(labelKey)
        return (
          <button
            key={id}
            title={label}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            onClick={() => setView(id)}
            className={`relative h-10 w-10 rounded-md flex items-center justify-center transition ${
              active
                ? "bg-[var(--bg-3)] text-up ring-1 ring-[rgba(0,255,159,0.35)]"
                : "text-[var(--fg-2)] hover:text-[var(--fg-0)] hover:bg-[var(--bg-3)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {active && <span className="absolute -left-[1px] top-2 bottom-2 w-[2px] bg-up rounded-r" />}
            {id === "agent" && !active && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#58c7ff] animate-pulse" />
            )}
          </button>
        )
      })}

      <div className="flex-1" />

      <div className="relative h-10 w-10 rounded-md flex items-center justify-center text-info ai-pulse">
        <Sparkles className="h-4 w-4" />
      </div>
      <div
        className="mt-1 text-[9px] text-ghost"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        v2025.11
      </div>
    </aside>
  )
}
