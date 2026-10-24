"use client"

import { TopBar } from "./TopBar"
import { LeftRail } from "./LeftRail"
import { ToastLayer } from "../ToastLayer"
import { ViewProvider, useView, type ViewId } from "./view-context"
import { WorkspaceView } from "./WorkspaceView"
import { AgentView } from "../views/AgentView"
import { MarketsView } from "../views/MarketsView"
import { DiscoverView } from "../views/DiscoverView"
import { BacktestView } from "../views/BacktestView"
import { RiskView } from "../views/RiskView"
import { JournalView } from "../views/JournalView"
import { SettingsView } from "./SettingsView"
import { motion, AnimatePresence } from "framer-motion"
import { useT, type DictKey } from "@/lib/i18n"

const VIEW_META: Record<ViewId, { title: DictKey; sub: DictKey; tag: string }> = {
  workspace: { title: "view.workspace.title", sub: "view.workspace.sub", tag: "01" },
  agent:     { title: "view.agent.title",     sub: "view.agent.sub",     tag: "02" },
  markets:   { title: "view.markets.title",   sub: "view.markets.sub",   tag: "03" },
  discover:  { title: "view.discover.title",  sub: "view.discover.sub",  tag: "04" },
  backtest:  { title: "view.backtest.title",  sub: "view.backtest.sub",  tag: "05" },
  risk:      { title: "view.risk.title",      sub: "view.risk.sub",      tag: "06" },
  journal:   { title: "view.journal.title",   sub: "view.journal.sub",   tag: "07" },
  settings:  { title: "view.settings.title",  sub: "view.settings.sub",  tag: "08" },
}

function ViewTitleBar() {
  const { view } = useView()
  const t = useT()
  const meta = VIEW_META[view]
  return (
    <div className="px-4 py-2 border-b border-[var(--line-1)] flex items-center gap-3 bg-[var(--bg-1)]/60">
      <span className="chip info text-[10px]">{meta.tag}</span>
      <div className="leading-tight">
        <div className="font-display font-semibold text-[13.5px]">{t(meta.title)}</div>
        <div className="text-[10.5px] text-ghost">{t(meta.sub)}</div>
      </div>
    </div>
  )
}

function ViewRenderer({ embedded = false }: { embedded?: boolean }) {
  const { view } = useView()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25 }}
        data-view={view}
        className="flex-1 min-w-0 min-h-0 flex"
      >
        {view === "workspace" && <WorkspaceView showAgent={!embedded} />}
        {view === "agent"     && <AgentView />}
        {view === "markets"   && <MarketsView />}
        {view === "discover"  && <DiscoverView />}
        {view === "backtest"  && <BacktestView />}
        {view === "risk"      && <RiskView />}
        {view === "journal"   && <JournalView />}
        {view === "settings"  && <SettingsView />}
      </motion.div>
    </AnimatePresence>
  )
}

function ExchangeTabs() {
  const { view, setView } = useView()
  const t = useT()
  const tabs: ViewId[] = ['markets', 'workspace', 'discover', 'journal', 'backtest', 'risk', 'settings']
  return <nav className="unified-subnav" aria-label="Exchange">
    {tabs.map(id => <button type="button" key={id} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>{t(VIEW_META[id].title)}</button>)}
  </nav>
}

export function RepositoryConsole({ initialView, onExit, embedded = false }: { initialView: ViewId; onExit: () => void; embedded?: boolean }) {
  return (
    <ViewProvider initialView={initialView}>
        <div className={embedded ? 'unified-exchange' : "h-screen w-screen bg-[var(--bg-0)] text-[var(--fg-0)] flex flex-col overflow-hidden hud-grid"}>
          {embedded ? <ExchangeTabs /> : <TopBar onExit={onExit} />}
          <div className="flex-1 flex min-h-0">
            {!embedded && <LeftRail onExit={onExit} />}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              {!embedded && <ViewTitleBar />}
              <div className="flex-1 min-w-0 min-h-0 p-2.5 flex overflow-auto">
                <ViewRenderer embedded={embedded} />
              </div>
            </div>
          </div>
          {!embedded && <ToastLayer />}
        </div>
    </ViewProvider>
  )
}
