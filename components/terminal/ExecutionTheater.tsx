'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowUpRight, Check, Database, Loader2, Radio, ShieldCheck, Sigma, Waypoints, X, Zap } from 'lucide-react'
import { executeStrategy, closePosition } from '@/lib/sandbox/client'
import type { ExecutionReport } from '@/lib/sandbox/types'
import { refreshLiveMarket } from '@/lib/market/live'
import { useLang } from '@/lib/i18n'
import type { StrategyDraft } from './StrategyViz'
import { fmtMoney, fmtPrice } from './primitives'

type Stage = 'validate' | 'risk' | 'quote' | 'oracle' | 'fill' | 'ledger'
const STAGES: Array<{ id: Stage; icon: typeof Check; zh: string; en: string; code: string }> = [
  { id: 'validate', icon: Sigma, zh: '策略校验', en: 'Validate', code: 'VAL' },
  { id: 'risk', icon: ShieldCheck, zh: '风控预检', en: 'Pre-trade risk', code: 'RSK' },
  { id: 'quote', icon: Radio, zh: '实时报价', en: 'Live quotes', code: 'QTE' },
  { id: 'oracle', icon: Waypoints, zh: '预言机校验', en: 'Oracle check', code: 'ORC' },
  { id: 'fill', icon: Zap, zh: '撮合成交', en: 'Matching', code: 'FIL' },
  { id: 'ledger', icon: Database, zh: '写入账本', en: 'Ledger write', code: 'LDG' },
]
const STEP_MS = 720

export type TheaterRequest = { kind: 'strategy'; draft: StrategyDraft } | { kind: 'close'; symbol: string }

export function ExecutionTheater({ request, onClose, onDone, onViewPortfolio }: { request: TheaterRequest; onClose: () => void; onDone?: (report: ExecutionReport) => void; onViewPortfolio?: () => void }) {
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const [report, setReport] = useState<ExecutionReport | null>(null)
  const [error, setError] = useState('')
  const [shown, setShown] = useState(0)
  const started = useRef(false)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const job = request.kind === 'strategy'
      ? executeStrategy(request.draft.spec, { ...request.draft.backtest, curve: undefined, strategyId: request.draft.strategyId })
      : closePosition(request.symbol)
    job.then(result => { setReport(result); refreshLiveMarket() }, e => setError((e as Error).message))
  }, [request])

  // 报告到达前前两步保持「运行中」，到达后按真实结果逐步揭示
  useEffect(() => {
    if (!report) return
    const failAt = report.plan.ok ? STAGES.length : 2
    if (shown >= failAt) { if (report.plan.ok) onDone?.(report); return }
    const id = setTimeout(() => setShown(n => n + 1), shown === 0 ? 260 : STEP_MS)
    return () => clearTimeout(id)
  }, [report, shown, onDone])

  useEffect(() => { closeButton.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const plan = report?.plan
  const done = !!report && (plan!.ok ? shown >= STAGES.length : shown >= 2)
  const title = request.kind === 'strategy' ? request.draft.spec.title : tr(`平仓 ${request.symbol}`, `Close ${request.symbol}`)
  const status = (i: number): 'wait' | 'run' | 'done' | 'fail' => {
    if (error) return i === 0 ? 'fail' : 'wait'
    if (!report) return i < 2 ? 'run' : 'wait'
    if (!plan!.ok && i === 1 && shown >= 2) return 'fail'
    if (i < shown) return 'done'
    if (i === shown && !done) return 'run'
    return 'wait'
  }
  const ms = (stage: Stage) => {
    if (!report) return null
    const t = report.timings
    return { validate: t.validate, risk: 1, quote: t.quotes, oracle: t.oracle, fill: 1, ledger: t.ledger }[stage]
  }

  return <div className="t-theater" role="dialog" aria-modal="true" aria-label={tr('模拟沙箱执行', 'Sandbox execution')}>
    <motion.div className="t-theater-card term" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .35, ease: [0.2, 0.8, 0.2, 1] }}>
      <header className="t-theater-head">
        <div><span className="t-code">EXE</span><span className="t-theater-kicker">{tr('模拟沙箱 · 不连接真实券商', 'Paper sandbox · no real broker')}</span><h2>{title}</h2>{report?.strategyRef && <span className="t-mono t-dim">{report.strategyRef} · op {report.executionId.slice(0, 8)}</span>}</div>
        <button ref={closeButton} type="button" className="t-icon-btn" onClick={onClose} aria-label={tr('关闭', 'Close')}><X size={18} /></button>
      </header>
      <ol className="t-pipeline">{STAGES.map((stage, i) => {
        const s = status(i)
        const Icon = stage.icon
        const t = ms(stage.id)
        return <li key={stage.id} className={`t-stage ${s}`}>
          <span className="t-stage-icon">{s === 'run' ? <Loader2 size={15} className="spin" /> : s === 'done' ? <Check size={15} /> : s === 'fail' ? <AlertTriangle size={15} /> : <Icon size={15} />}</span>
          <span className="t-stage-label"><b>{lang === 'en' ? stage.en : stage.zh}</b><small>{stage.code}{s === 'done' && t !== null && t > 1 ? ` · ${t} ms` : ''}</small></span>
        </li>
      })}</ol>

      <div className="t-theater-body" aria-live="polite">
        {error && <p className="t-error">{error}</p>}
        {!report && !error && <p className="t-wait">{tr('正在校验策略并拉取实时报价与链上喂价…', 'Validating the strategy and pulling live quotes and on-chain feeds…')}</p>}
        <AnimatePresence initial={false}>
          {report && shown >= 1 && <motion.section key="risk" className="t-step" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h3>{tr('风控与市场状态', 'Risk & session checks')}</h3>
            <ul className="t-checks">{plan!.checks.map(c => <li key={c.id} className={c.status}>{c.status === 'pass' ? <Check size={13} /> : <AlertTriangle size={13} />}<span>{lang === 'en' ? c.en : c.zh}</span></li>)}</ul>
          </motion.section>}
          {report && plan!.ok && shown >= 3 && <motion.section key="quotes" className="t-step" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h3>{tr('报价与预言机交叉校验', 'Quote vs oracle')}</h3>
            <table className="t-table compact"><thead><tr><th>{tr('标的', 'Symbol')}</th><th>{tr('实时报价', 'Quote')}</th><th>{tr('时段', 'Session')}</th><th>Chainlink</th><th>{tr('偏离', 'Dev.')}</th></tr></thead>
              <tbody>{plan!.orders.map(o => <tr key={o.symbol}><td className="t-sym">{o.symbol}</td><td className="t-num">{fmtPrice(o.quotePrice, o.symbol)}</td><td><span className={`t-pill ${o.session}`}>{o.session === 'open' ? tr('交易中', 'open') : tr('闭市·最后价', 'closed·last')}</span></td><td className="t-num">{shown >= 4 ? o.oraclePrice ? fmtPrice(o.oraclePrice, o.symbol) : tr('无喂价', 'no feed') : '…'}</td><td className="t-num t-dim">{shown >= 4 && o.deviation !== null ? `${(o.deviation * 100).toFixed(2)}%` : ''}</td></tr>)}</tbody></table>
          </motion.section>}
          {report && plan!.ok && shown >= 5 && <motion.section key="fills" className="t-step" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h3>{tr('成交回报', 'Fills')}</h3>
            <div className="t-fills">{plan!.orders.map((o, i) => <div key={o.symbol} className="t-fill" style={{ animationDelay: `${i * 0.12}s` }}>
              <span className={`t-side ${o.side}`}>{o.side === 'buy' ? 'BUY' : 'SELL'}</span>
              <span className="t-sym">{o.symbol}</span>
              <span className="t-num">{o.qty}</span>
              <span className="t-num">@ {fmtPrice(o.fillPrice, o.symbol)}</span>
              <span className="t-num t-dim">{o.slippageBps}bp · {tr('费', 'fee')} {fmtMoney(o.fee, 2)}</span>
              <span className="t-num t-fill-amt">{fmtMoney(o.notional, 2)}</span>
              <i className="t-fill-bar" style={{ animationDelay: `${i * 0.12}s` }} />
            </div>)}</div>
          </motion.section>}
          {report && plan!.ok && shown >= 6 && <motion.section key="ledger" className="t-step t-ledger" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h3>{report.mode === 'db' ? tr('已写入 Supabase', 'Written to Supabase') : tr('已写入本地账本', 'Written to local ledger')}</h3>
            {report.mode === 'db'
              ? <p className="t-mono">sandbox_executions ← {report.executionId.slice(0, 8)}… · sandbox_orders ← {report.orderIds.length} rows {report.orderIds.slice(0, 3).map(id => id.slice(0, 6)).join(' ')}</p>
              : <p className="t-dim">{tr('数据库迁移尚未上线，成交保存在本浏览器。', 'Database migration not live yet; fills are kept in this browser.')}</p>}
            <div className="t-ledger-sum"><span>{tr('现金', 'Cash')} <b className="t-num">{fmtMoney(plan!.cashBefore)}</b> → <b className="t-num">{fmtMoney(report.cash)}</b></span><span>{tr('成交额', 'Notional')} <b className="t-num">{fmtMoney(plan!.gross)}</b></span><span>{tr('费用', 'Fees')} <b className="t-num">{fmtMoney(plan!.fees, 2)}</b></span><span>{tr('总耗时', 'Total')} <b className="t-num">{report.timings.total} ms</b></span></div>
          </motion.section>}
          {report && !plan!.ok && shown >= 2 && <motion.p key="rejected" className="t-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{tr('订单被风控拦截，未产生任何成交。', 'Rejected by pre-trade risk. Nothing was filled.')}</motion.p>}
        </AnimatePresence>
      </div>
      <footer className="t-theater-foot">
        <span className="t-dim">{tr('报价：Yahoo Finance · 校验：Chainlink（Arbitrum One）· 模拟资金，无真实交易', 'Quotes: Yahoo Finance · Check: Chainlink (Arbitrum One) · Simulated funds only')}</span>
        {done && plan!.ok && onViewPortfolio && <button type="button" className="t-btn primary" onClick={onViewPortfolio}>{tr('在交易所查看组合', 'Open portfolio')}<ArrowUpRight size={15} /></button>}
        {(done || error) && <button type="button" className="t-btn" onClick={onClose}>{tr('完成', 'Done')}</button>}
      </footer>
    </motion.div>
  </div>
}
