'use client'

import { useCallback, useState } from 'react'
import { AgentChat } from '@/components/dash/AgentChat'
import { RequireAccount } from '@/components/account/AccountAccess'
import { ResearchCanvas, type ToolRun } from '@/components/terminal/ResearchCanvas'
import { ExecutionTheater, type TheaterRequest } from '@/components/terminal/ExecutionTheater'
import type { StrategyDraft } from '@/components/terminal/StrategyViz'
import type { StreamEvent } from '@/lib/ai/protocol'

/**
 * Agent 页：左边对话是主体，右边研究画布跟着 Agent 的工具调用实时联动，
 * 策略卡上的「部署」打开执行面板，成交写进沙箱账本后在画布和交易所里实时盯市。
 */
export function AgentWorkspace({ onOpenExchange }: { onOpenExchange?: (symbol?: string) => void }) {
  const [runs, setRuns] = useState<ToolRun[]>([])
  const [thinking, setThinking] = useState(false)
  const [focus, setFocus] = useState<StrategyDraft | null>(null)
  const [theater, setTheater] = useState<TheaterRequest | null>(null)

  const onEvent = useCallback((event: StreamEvent) => {
    if (event.type === 'tool_start') setRuns(prev => [...prev, { id: event.id, name: event.name, arguments: event.arguments, startedAt: Date.now() }])
    else setRuns(prev => prev.some(r => r.id === event.trace.id)
      ? prev.map(r => r.id === event.trace.id ? { ...r, trace: event.trace } : r)
      : [...prev, { id: event.trace.id, name: event.trace.name, arguments: event.trace.arguments, startedAt: Date.now() - event.trace.durationMs, trace: event.trace }])
  }, [])
  const onTurn = useCallback((state: 'start' | 'end') => {
    setThinking(state === 'start')
    if (state === 'start') { setRuns([]); setFocus(null) }
  }, [])
  const onDeploy = useCallback((draft: StrategyDraft) => setTheater({ kind: 'strategy', draft }), [])

  return <section className="agent-ws">
    <div className="unified-chat"><RequireAccount><AgentChat onEvent={onEvent} onTurn={onTurn} onDeploy={onDeploy} onFocus={setFocus} /></RequireAccount></div>
    <ResearchCanvas runs={runs} thinking={thinking} focus={focus} onDeploy={onDeploy} onOpenExchange={onOpenExchange} onClearFocus={() => setFocus(null)} />
    {theater && <ExecutionTheater request={theater} onClose={() => setTheater(null)} onViewPortfolio={() => { setTheater(null); onOpenExchange?.() }} />}
  </section>
}
