'use client'

import { motion } from 'framer-motion'
import { Maximize2, Rocket } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import type { DriverReport } from '@/lib/quant/drivers'
import { AllocationBar, EquityCurve, MetricStrip, type StrategyDraft } from '@/components/terminal/StrategyViz'

export function StrategyCard({ draft, onDeploy, onFocus }: { draft: StrategyDraft; onDeploy?: (draft: StrategyDraft) => void; onFocus?: (draft: StrategyDraft) => void }) {
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const { spec, backtest } = draft
  const rebalance = { none: tr('不再平衡', 'No rebalance'), monthly: tr('月度再平衡', 'Monthly rebalance'), quarterly: tr('季度再平衡', 'Quarterly rebalance') }[spec.rebalance]
  return <motion.article className="strategy-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
    <header>
      <span className="strategy-tag">{tr('策略书', 'STRATEGY')} · {draft.strategyId}</span>
      <span className="strategy-risk" aria-label={tr(`风险等级 ${spec.riskLevel}/5`, `Risk ${spec.riskLevel}/5`)}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= spec.riskLevel ? 'on' : ''} />)}</span>
    </header>
    <h3>{spec.title}</h3>
    <p className="strategy-thesis">{spec.thesis}</p>
    <AllocationBar spec={spec} lang={lang} />
    <div className="strategy-chart"><EquityCurve backtest={backtest} lang={lang} height={150} /></div>
    <MetricStrip backtest={backtest} lang={lang} />
    <dl className="strategy-terms">
      <div><dt>{tr('本金', 'Capital')}</dt><dd>${spec.capital.toLocaleString()}</dd></div>
      <div><dt>{tr('调仓', 'Rebalance')}</dt><dd>{rebalance}</dd></div>
      <div><dt>{tr('回撤止损', 'Drawdown stop')}</dt><dd>{spec.stopLoss ? `${(spec.stopLoss * 100).toFixed(0)}%` : tr('无', 'None')}</dd></div>
      <div><dt>{tr('周期', 'Horizon')}</dt><dd>{spec.horizon}</dd></div>
    </dl>
    <footer>
      {onDeploy && <button type="button" className="strategy-deploy" onClick={() => onDeploy(draft)}><Rocket size={15} />{tr('部署到模拟沙箱', 'Deploy to sandbox')}</button>}
      {onFocus && <button type="button" className="strategy-focus" onClick={() => onFocus(draft)}><Maximize2 size={14} />{tr('在画布中查看', 'View on canvas')}</button>}
      <small>{tr(`回测 ${backtest.start} → ${backtest.end} · Yahoo 复权日线 · 历史模拟，不代表未来`, `Backtest ${backtest.start} → ${backtest.end} · Yahoo adjusted daily · historical, not a forecast`)}</small>
    </footer>
  </motion.article>
}

export function DriverChips({ report }: { report: DriverReport }) {
  const { lang } = useLang()
  const kept = report.edges.filter(e => e.kept)
  const confounded = report.edges.filter(e => e.confounded)
  return <div className="driver-chips" aria-label={lang === 'en' ? 'Driver analysis' : '驱动分析'}>
    <span className="driver-chips-title">{lang === 'en' ? `What moves ${report.target}` : `什么在推动 ${report.target}`}</span>
    {kept.map(e => <span key={e.driver} className={`driver-chip ${e.partial >= 0 ? 'pos' : 'neg'}`}><b>{e.driver}</b>lag {e.lag} · ρ {e.partial.toFixed(2)}</span>)}
    {confounded.map(e => <span key={e.driver} className="driver-chip muted"><b>{e.driver}</b>{lang === 'en' ? 'market only' : '随大盘'}</span>)}
    {!kept.length && <span className="driver-chip muted">{lang === 'en' ? 'No significant driver after removing the market' : '剔除大盘后没有显著驱动'}</span>}
  </div>
}
