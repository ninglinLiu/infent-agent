'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Check, Loader2, Rocket, X } from 'lucide-react'
import type { ToolTrace } from '@/lib/ai/tools'
import type { DriverReport } from '@/lib/quant/drivers'
import { useLiveMarket } from '@/lib/market/live'
import { useSandbox } from '@/lib/sandbox/client'
import { useAccount } from '@/components/account/AccountProvider'
import { useLang } from '@/lib/i18n'
import { MarketBoard, OraclePanel, TickerTape, WorldClocks } from './MarketBoard'
import { AllocationBar, DriverGraph, EquityCurve, MetricStrip, type StrategyDraft } from './StrategyViz'
import { FlashNumber, fmtMoney, fmtPct, fmtPrice, LiveDot, Panel, useTween } from './primitives'

export type ToolRun = { id: string; name: string; arguments: Record<string, unknown>; startedAt: number; trace?: ToolTrace }

export function draftFrom(trace?: ToolTrace): StrategyDraft | null {
  if (!trace || trace.name !== 'draft_strategy' || !trace.result.ok) return null
  const data = trace.result.data as Partial<StrategyDraft>
  return data.spec && data.backtest && data.strategyId ? data as StrategyDraft : null
}
export function driversFrom(trace?: ToolTrace): DriverReport | null {
  if (!trace || trace.name !== 'analyze_drivers' || !trace.result.ok) return null
  const data = trace.result.data as Partial<DriverReport>
  return Array.isArray(data.edges) ? data as DriverReport : null
}

function summary(run: ToolRun, lang: 'zh' | 'en') {
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const r = run.trace?.result
  if (!r) return ''
  if (!r.ok) return `${r.code}`
  const data = r.data as Record<string, unknown>
  if (run.name === 'get_price') return `${data.price} ${data.currency} · ${r.source}`
  if (run.name === 'analyze_drivers') {
    const report = data as unknown as DriverReport
    return tr(`${report.edges.filter(e => e.kept).length}/${report.edges.length} 个驱动显著 · ${report.observations} 日`, `${report.edges.filter(e => e.kept).length}/${report.edges.length} drivers kept · ${report.observations}d`)
  }
  if (run.name === 'draft_strategy') {
    const draft = data as unknown as StrategyDraft
    return `${draft.strategyId} · ${fmtPct(draft.backtest.totalReturn, 1, true)} / DD ${fmtPct(draft.backtest.maxDrawdown, 1, true)}`
  }
  if (run.name === 'get_onchain_stats') return `${data.balanceEth} ETH · block ${data.blockNumber}`
  return r.source
}

function argLabel(run: ToolRun) {
  const a = run.arguments
  if (typeof a.symbol === 'string') return a.symbol
  if (typeof a.title === 'string') return a.title
  if (typeof a.address === 'string') return `${a.address.slice(0, 8)}…`
  return ''
}

function AgentTrace({ runs, thinking }: { runs: ToolRun[]; thinking: boolean }) {
  const { lang } = useLang()
  const [now, setNow] = useState(Date.now())
  const running = runs.some(r => !r.trace)
  useEffect(() => { if (!running) return; const id = setInterval(() => setNow(Date.now()), 100); return () => clearInterval(id) }, [running])
  return <div className="t-trace" role="log" aria-label={lang === 'en' ? 'Agent tool calls' : 'Agent 工具调用'}>
    {runs.map(run => <motion.div key={run.id} className={`t-trace-line ${run.trace ? run.trace.result.ok ? 'ok' : 'err' : 'run'}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
      <span className="t-dim">{new Date(run.startedAt).toLocaleTimeString('en-GB', { hour12: false })}</span>
      <span className="t-trace-icon">{run.trace ? run.trace.result.ok ? <Check size={12} /> : <X size={12} /> : <Loader2 size={12} className="spin" />}</span>
      <b>{run.name}</b><span className="t-trace-arg">{argLabel(run)}</span>
      <span className="t-num t-dim">{((run.trace?.durationMs ?? now - run.startedAt) / 1000).toFixed(1)}s</span>
      <span className="t-trace-out">{summary(run, lang)}</span>
    </motion.div>)}
    {thinking && <div className="t-trace-line run"><span className="t-dim">{new Date().toLocaleTimeString('en-GB', { hour12: false })}</span><span className="t-trace-icon"><Loader2 size={12} className="spin" /></span><b>deepseek</b><span className="t-trace-arg">{lang === 'en' ? 'reasoning…' : '推理中…'}</span><span className="t-cursor" /></div>}
  </div>
}

export function LiveBook({ onOpenPortfolio }: { onOpenPortfolio?: () => void }) {
  const { user } = useAccount()
  const { portfolio } = useSandbox(user?.id)
  const live = useLiveMarket()
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const positions = portfolio?.positions ?? []
  const value = positions.reduce((s, p) => s + p.qty * (live.quotes[p.symbol]?.price ?? p.cost), 0)
  const nav = (portfolio?.cash ?? 0) + value
  const shownNav = useTween(nav)
  if (!user || !positions.length) return null
  return <Panel code="PRT" title={tr('模拟持仓 · 实时盯市', 'Paper book · marked live')} right={<><LiveDot status={live.status} /><span>{portfolio?.mode === 'db' ? 'Supabase' : tr('本地账本', 'Local ledger')}</span></>}>
    <div className="t-nav"><small>{tr('组合净值', 'Net asset value')}</small><b className="t-num">{fmtMoney(shownNav, 2)}</b><span className={`t-num ${nav >= 100000 ? 't-up' : 't-down'}`}>{fmtPct(nav / 100000 - 1, 2, true)}</span>{onOpenPortfolio && <button type="button" className="t-link" onClick={onOpenPortfolio}>{tr('完整组合', 'Full portfolio')}<ArrowUpRight size={13} /></button>}</div>
    <table className="t-table compact"><tbody>{positions.map(p => {
      const q = live.quotes[p.symbol]
      const pnl = q ? (q.price - p.cost) * p.qty : 0
      return <tr key={p.symbol}><td className="t-sym">{p.symbol}</td><td className="t-num t-dim">{p.qty}</td><td><FlashNumber value={q?.price} flash={live.flashes[p.symbol]}>{fmtPrice(q?.price, p.symbol)}</FlashNumber></td><td className={`t-num ${pnl >= 0 ? 't-up' : 't-down'}`}>{fmtMoney(pnl, 2)}</td></tr>
    })}</tbody></table>
  </Panel>
}

export function ResearchCanvas({ runs, thinking, focus, onDeploy, onOpenExchange, onClearFocus }: {
  runs: ToolRun[]
  thinking: boolean
  focus: StrategyDraft | null
  onDeploy?: (draft: StrategyDraft) => void
  onOpenExchange?: (symbol?: string) => void
  onClearFocus?: () => void
}) {
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const drivers = [...runs].reverse().map(r => driversFrom(r.trace)).find(Boolean) ?? null
  const draft = focus ?? [...runs].reverse().map(r => draftFrom(r.trace)).find(Boolean) ?? null
  const active = runs.length > 0 || thinking || !!focus
  return <aside className="research-canvas term" aria-label={tr('研究画布', 'Research canvas')}>
    <div className="t-topbar"><span className="t-brand">OMNI<b>·</b>TERMINAL</span><WorldClocks /></div>
    <TickerTape />
    <div className="t-scroll">
      {active && <Panel code="RUN" title={tr('Agent 执行轨迹', 'Agent run')} right={thinking ? <><LiveDot status="live" /><span>{tr('运行中', 'running')}</span></> : focus ? <button type="button" className="t-link" onClick={onClearFocus}>{tr('收起', 'Clear')}</button> : undefined}>
        {runs.length || thinking ? <AgentTrace runs={runs} thinking={thinking} /> : <p className="t-empty">{tr('来自历史对话的策略书', 'Strategy from conversation history')}</p>}
      </Panel>}
      {drivers && <Panel code="DRV" title={tr(`驱动分析 · ${drivers.target}`, `Driver map · ${drivers.target}`)} right={<span>{drivers.start} → {drivers.end}</span>}>
        <DriverGraph key={drivers.start + drivers.target} report={drivers} lang={lang} />
        <p className="t-foot">{tr('实线 = 剔除大盘后仍显著的领先/同步相关；虚线 = 只是跟着大盘动。相关不等于因果。', 'Solid = significant after removing the market; dashed = only moves with the market. Correlation is not causation.')}</p>
      </Panel>}
      {draft && <Panel code="BT" title={draft.spec.title} right={<span className="t-mono">{draft.strategyId}</span>} className="t-strategy">
        <AllocationBar spec={draft.spec} lang={lang} />
        <EquityCurve key={draft.strategyId} backtest={draft.backtest} lang={lang} />
        <div className="t-legend"><span><i className="line" />{tr('策略', 'Strategy')}</span><span><i className="bench" />{draft.backtest.benchmark.symbol}</span><span><i className="dd" />{tr('最大回撤区间', 'Max drawdown window')}</span></div>
        <MetricStrip backtest={draft.backtest} lang={lang} />
        {onDeploy && <button type="button" className="t-btn primary wide" onClick={() => onDeploy(draft)}><Rocket size={15} />{tr('部署到模拟沙箱', 'Deploy to paper sandbox')}</button>}
        <p className="t-foot">{tr(`回测 ${draft.backtest.start} → ${draft.backtest.end}，Yahoo 复权日线，5bp 交易成本。历史模拟，不代表未来。`, `Backtest ${draft.backtest.start} → ${draft.backtest.end}, Yahoo adjusted daily, 5bp costs. Historical simulation, not a forecast.`)}</p>
      </Panel>}
      <LiveBook onOpenPortfolio={() => onOpenExchange?.()} />
      <MarketBoard compact groups={active ? ['idx', 'macro'] : ['idx', 'macro', 'us', 'hk', 'crypto']} onPick={symbol => onOpenExchange?.(symbol)} />
      <OraclePanel limit={active ? 6 : 14} />
    </div>
  </aside>
}
