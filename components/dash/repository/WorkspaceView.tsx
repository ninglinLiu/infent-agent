"use client"

import { KLineChart } from "@/components/dash/KLineChart"
import { MetricCards } from "@/components/dash/MetricCards"
import { StrategyTimeline } from "@/components/dash/StrategyTimeline"
import { PortfolioPanel } from "@/components/dash/PortfolioPanel"
import { HeatMap } from "@/components/dash/HeatMap"
import { NewsTicker } from "@/components/dash/NewsTicker"
import { AgentChat } from "@/components/dash/AgentChat"

export function WorkspaceView({ showAgent = true }: { showAgent?: boolean }) {
  return (
    <div className="flex-1 min-w-0 flex gap-2.5 min-h-0 overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col gap-2.5 min-h-0 overflow-y-auto thin-scroll pr-1">
        <MetricCards />
        <div className="flex-[1.4] min-h-[320px]">
          <KLineChart />
        </div>
        <div className="grid grid-cols-2 gap-2.5 flex-1 min-h-[220px]">
          <StrategyTimeline />
          <PortfolioPanel />
        </div>
        <div className="grid grid-cols-[1.4fr_1fr] gap-2.5 flex-1 min-h-[200px]">
          <HeatMap />
          <NewsTicker />
        </div>
      </div>
      {showAgent && <div className="w-[400px] shrink-0 flex flex-col min-h-0">
        <AgentChat />
      </div>}
    </div>
  )
}
