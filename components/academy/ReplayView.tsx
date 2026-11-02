"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { maxDrawdown } from '@/lib/quant/stats'
import { useHistoryFile } from '@/lib/academy/use-history'
import { ACTION_LABEL, applyAction, checkpointIndexes, REPLAY_ACTIONS, REPLAY_CASES, replayResult, simulate, verdict, type ReplayAction, type ReplayCase, type Series } from '@/lib/academy/replay'
import { useAcademy } from './AcademyProvider'
import { useAcademyLocale } from './useAcademyLocale'
import { AcademyScene } from './ImmersiveScene'
import { HistoryChart, type ChartMarker } from './HistoryChart'
import { SimulationView } from './SimulationView'

const money = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`
const pct = (value: number, digits = 1) => `${value > 0 ? '+' : ''}${(value * 100).toFixed(digits)}%`

export function StudyMentor({ mentor = 'value', text, label }: { mentor?: 'value' | 'quant'; text: string; label: string }) {
  const { tr, content: { mentors } } = useAcademyLocale()
  return <aside className="study-mentor">
    <div className="study-mentor-scene"><AcademyScene mentor={mentor} compact /></div>
    <div className="study-bubble">
      <div className="study-bubble-name">{mentors[mentor].name}<small>{label}</small></div>
      <p>{text}</p>
      <small className="study-bubble-note">{tr('虚构教学对白，不是本人言论', 'Fictional teaching dialogue, not a real quote')}</small>
    </div>
  </aside>
}

function Stage({ item, series, onExit }: { item: ReplayCase; series: Series; onExit: () => void }) {
  const { tr, lang } = useAcademyLocale()
  const { state, update } = useAcademy()
  const points = useMemo(() => checkpointIndexes(series, item.checkpoints), [series, item])
  const [actions, setActions] = useState<ReplayAction[]>([])
  const [reveal, setReveal] = useState(0)
  const [moving, setMoving] = useState(true)
  const frame = useRef(0)
  const saved = useRef(false)
  const text = (value: { zh: string; en: string }) => value[lang === 'en' ? 'en' : 'zh']

  const animate = (from: number, target: number) => {
    cancelAnimationFrame(frame.current)
    if (state.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setReveal(target); setMoving(false); return }
    setMoving(true)
    const began = performance.now(), ms = Math.min(2200, 900 + (target - from) * 12)
    const step = (now: number) => {
      const t = Math.min(1, (now - began) / ms)
      setReveal(Math.round(from + (target - from) * (1 - (1 - t) ** 2)))
      if (t < 1) frame.current = requestAnimationFrame(step)
      else setMoving(false)
    }
    frame.current = requestAnimationFrame(step)
  }
  // 打开案例：从第一天走到第一个决策点
  const opening = useRef(() => animate(0, points[0]))
  useEffect(() => { opening.current(); return () => cancelAnimationFrame(frame.current) }, [])

  const stage = actions.length
  const total = item.checkpoints.length
  const finished = stage >= total && reveal >= series.closes.length - 1 && !moving
  const atDecision = !moving && stage < total && reveal === points[stage]
  const checkpoint = item.checkpoints[Math.min(stage, total - 1)]
  const { values, position } = simulate(series, points, actions, reveal)
  const value = values[values.length - 1]
  const price = series.closes[reveal]
  const fromPeak = price / Math.max(...series.closes.slice(0, reveal + 1)) - 1
  const exposure = position.shares * price / value
  const result = finished ? replayResult(series, points, actions) : null
  const markers: ChartMarker[] = actions.map((a, i) => ({ index: points[i], label: text(ACTION_LABEL[a].title), tone: a }))

  const final = result?.final, hold = result?.hold
  useEffect(() => {
    if (final === undefined || hold === undefined || saved.current) return
    saved.current = true
    // 写入账号的学习进度；数值取整，控制进度数据体积
    update({ replays: { ...state.replays, [item.id]: { final: Math.round(final), hold: Math.round(hold), decisions: actions, at: new Date().toISOString() } } })
    // 只在完成时保存一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [final, hold])

  const isNoOp = (action: ReplayAction) => {
    if (action === 'hold') return false
    const next = applyAction(position, action, price)
    return next.cash === position.cash && next.shares === position.shares
  }
  const decide = (action: ReplayAction) => {
    const next = [...actions, action]
    setActions(next)
    animate(reveal, next.length < total ? points[next.length] : series.closes.length - 1)
  }
  const restart = () => { saved.current = false; setActions([]); setReveal(0); animate(0, points[0]) }
  const drawdown = maxDrawdown(series.closes)

  return <div className="study-player">
    <header className="study-player-head">
      <button type="button" className="study-back" onClick={onExit}><ArrowLeft size={16} />{tr('全部案例', 'All cases')}</button>
      <div><h1>{text(item.name)}</h1><p>{series.symbol} · {text(item.period)}</p></div>
      <ol className="study-steps" aria-label={tr('决策节点', 'Decision points')}>{item.checkpoints.map((cp, i) => <li key={cp.date} className={i < stage ? 'done' : i === stage ? 'now' : ''} />)}</ol>
    </header>
    <div className="study-player-grid">
      <div className="study-main">
        <section className="study-chart-card">
          <HistoryChart dates={series.dates} values={series.closes} reveal={reveal} markers={markers} band={result ? [drawdown.from, drawdown.to] : undefined} ariaLabel={tr(`${series.symbol} 真实历史走势，截至 ${series.dates[reveal]}`, `${series.symbol} real price history up to ${series.dates[reveal]}`)} />
          <dl className="study-account">
            <div><dt>{tr('日期', 'Date')}</dt><dd>{series.dates[reveal]}</dd></div>
            <div><dt>{tr('复权价', 'Adj. price')}</dt><dd>{price.toFixed(2)}</dd></div>
            <div><dt>{tr('距高点', 'From peak')}</dt><dd className={fromPeak < -0.001 ? 'down' : ''}>{pct(fromPeak)}</dd></div>
            <div><dt>{tr('账户总值', 'Account')}</dt><dd>{money(value)}</dd></div>
            <div><dt>{tr('仓位', 'Exposure')}</dt><dd>{(exposure * 100).toFixed(0)}%</dd></div>
          </dl>
        </section>
        {!result && <section className={`study-decision ${atDecision ? 'ready' : ''}`} aria-live="polite">
          {stage === 0 && <p className="study-setup">{text(item.setup)}</p>}
          <div className="study-event"><time>{series.dates[reveal]}</time><p>{atDecision ? text(checkpoint.event) : tr('时间在流逝……', 'Time passes…')}</p></div>
          <div className="study-actions">{REPLAY_ACTIONS.map(action => <button type="button" key={action} disabled={!atDecision || isNoOp(action)} onClick={() => decide(action)}><b>{text(ACTION_LABEL[action].title)}</b><small>{text(ACTION_LABEL[action].note)}</small></button>)}</div>
        </section>}
        {result && <section className="study-result">
          <div className="study-result-grid">
            <div className="primary"><small>{tr('你的结果', 'Your result')}</small><b>{money(result.final)}</b><span>{pct(result.final / 100000 - 1)} · {tr('最大回撤', 'max DD')} {pct(result.maxDrawdown)}</span></div>
            <div><small>{tr('一直不动', 'Never trading')}</small><b>{money(result.hold)}</b><span>{pct(result.hold / 100000 - 1)} · {tr('最大回撤', 'max DD')} {pct(result.holdDrawdown)}</span></div>
            <div><small>{tr('满仓持有', 'Fully invested')}</small><b>{money(result.allIn)}</b><span>{tr('标的涨跌', 'Asset')} {pct(result.assetReturn)}</span></div>
          </div>
          <ol className="study-timeline">{item.checkpoints.map((cp, i) => <li key={cp.date}><time>{cp.date}</time><span>{text(cp.event)}</span><b className={actions[i]}>{text(ACTION_LABEL[actions[i]].title)}</b></li>)}</ol>
          <div className="study-result-actions"><button type="button" className="study-btn primary" onClick={restart}><RotateCcw size={15} />{tr('换个决定再来一次', 'Try different decisions')}</button><button type="button" className="study-btn" onClick={onExit}>{tr('看其他案例', 'Other cases')}<ArrowRight size={15} /></button></div>
        </section>}
        <p className="study-source">{tr(`价格：${series.source}，快照 ${series.snapshot}。事件为真实历史；复盘不计交易成本，仅供学习。`, `Prices: ${series.source}, snapshot ${series.snapshot}. Events are real history; no trading costs; for learning only.`)}</p>
      </div>
      <StudyMentor label={result ? tr('复盘', 'Review') : tr('提问', 'Asks')} text={result ? verdict(result, actions, lang === 'en' ? 'en' : 'zh') : atDecision ? text(checkpoint.ask) : text(item.hook)} />
    </div>
  </div>
}

function Player({ item, onExit }: { item: ReplayCase; onExit: () => void }) {
  const { tr } = useAcademyLocale()
  const { data: series, failed, retry } = useHistoryFile<Series>(item.id)
  if (failed) return <div className="study-empty"><p>{tr('历史数据加载失败。', 'Could not load the history data.')}</p><button type="button" className="study-btn" onClick={retry}>{tr('重试', 'Retry')}</button></div>
  if (!series) return <div className="study-empty" role="status">{tr('正在读取历史行情…', 'Loading market history…')}</div>
  return <Stage item={item} series={series} onExit={onExit} />
}

export function ReplayView() {
  const { tr, lang } = useAcademyLocale()
  const { state } = useAcademy()
  const [active, setActive] = useState<ReplayCase | null>(null)
  const [legacy, setLegacy] = useState(false)
  const text = (value: { zh: string; en: string }) => value[lang === 'en' ? 'en' : 'zh']
  if (legacy) return <div className="study-page"><button type="button" className="study-back" onClick={() => setLegacy(false)}><ArrowLeft size={16} />{tr('回到历史复盘', 'Back to history replays')}</button><SimulationView /></div>
  if (active) return <div className="study-page"><Player key={active.id} item={active} onExit={() => setActive(null)} /></div>
  return <div className="study-page">
    <header className="study-intro"><h1>{tr('把历史走一遍，这次由你做决定。', 'Walk through history. This time, you decide.')}</h1><p>{tr('每段都是真实行情。走到关键节点停下来，你只能看到当时能看到的东西，决定之后才知道后面发生了什么。', 'Every price is real. You stop at key moments, seeing only what people could see then, and find out what happened only after you decide.')}</p></header>
    <div className="study-cases">{REPLAY_CASES.map((item, i) => {
      const record = state.replays?.[item.id]
      return <button type="button" key={item.id} className="study-case" onClick={() => setActive(item)}>
        <span className="study-case-index">{String(i + 1).padStart(2, '0')}</span>
        <h2>{text(item.name)}</h2>
        <span className="study-case-meta">{item.symbol} · {text(item.period)}</span>
        <p>{text(item.hook)}</p>
        <span className="study-case-foot">{record
          ? <span>{tr('上次', 'Last run')} <b>{money(record.final)}</b> · {tr('一直不动', 'Hold')} {money(record.hold)}</span>
          : <span>{tr('开始复盘', 'Start replay')}</span>}<ArrowRight size={16} /></span>
      </button>
    })}</div>
    <button type="button" className="study-legacy" onClick={() => setLegacy(true)}>{tr('查看旧版可口可乐漫画练习', 'Open the earlier Coca-Cola comic exercise')}</button>
  </div>
}
