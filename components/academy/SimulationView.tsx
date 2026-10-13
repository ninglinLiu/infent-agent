"use client"

import { useEffect, useRef } from 'react'
import { ArrowRight, Check, ClipboardList, Coffee, Trophy } from 'lucide-react'
import { useAcademyLocale } from './useAcademyLocale'
import { useAcademy } from './AcademyProvider'
import { AcademyScene } from './ImmersiveScene'
import { useView } from '@/components/dash/view-context'

export function SimulationView({ hideScene = false }: { hideScene?: boolean }) {
  const { state, update } = useAcademy()
  const { setView } = useView()
  const { tr, content: { mentors: MENTORS, simulation: SIMULATION } } = useAcademyLocale()
  const finished = state.simulationStep >= SIMULATION.length
  const scene = SIMULATION[Math.min(state.simulationStep, SIMULATION.length - 1)]
  const bought = state.simulationStep >= 3
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [state.simulationStep])
  return <div className="academy-page">
    <div className="academy-page-heading"><div><div className="academy-eyebrow">LEARN BY DOING</div><h1>{tr("成为故事里的研究员。", "Step into the researcher’s shoes.")}</h1><p>{tr("第一天 · 候鸟咖啡研究案 · 固定剧情模拟", "Day one · Migratory Coffee · A guided simulation")}</p></div><span className="academy-progress-badge"><Coffee size={18} />{Math.min(state.simulationStep + 1, 4)} / 4 {tr("步", "steps")}</span></div>
    <div className="academy-simulation-grid">
      {!hideScene && <section className="academy-simulation-stage"><AcademyScene mentor={scene.mentor} chapter={state.simulationStep} /><div className="academy-scene-label"><span className="academy-live-dot" />{MENTORS[scene.mentor].name}<small>{MENTORS[scene.mentor].role} · {tr("虚构教学角色", "Fictional teaching character")}</small></div></section>}
      <section className="academy-simulation-dialogue academy-enter" key={state.simulationStep}>
        <div className="academy-eyebrow">{finished ? 'CASE CLOSED' : `${tr("场景", "SCENE")} 0${state.simulationStep + 1} / 04`}</div>
        <h2 ref={heading} tabIndex={-1}>{finished ? tr("第一次实践，完成。", "Your first practice is complete.") : scene.title}</h2>
        <p>{finished ? tr("你完成了研究、制定规则、模拟执行和复盘。这个故事的重点，是建立可以检查的过程，而不是让每一笔交易都盈利。", "You researched, defined rules, simulated an order, and reviewed the outcome. The aim is a process you can examine, not a profit on every trade.") : scene.text}</p>
        <div className="academy-paper-account"><div className="academy-account-title"><ClipboardList size={16} />{tr("剧情模拟账户", "Story simulation account")}<span>{tr("模拟币", "Simulated credits")}</span></div><div className="academy-balance"><small>{tr("账户总值", "Account value")}</small><strong>{bought ? '9,800' : '10,000'}<span>.00</span></strong></div><div className="academy-account-details"><div><small>{tr("可用余额", "Available balance")}</small><strong>{bought ? '8,000' : '10,000'}</strong></div><div><small>{tr("候鸟咖啡", "Migratory Coffee")}</small><strong>{bought ? tr("20 份", "20 shares") : tr("0 份", "0 shares")}</strong></div><div><small>{tr("持仓浮盈亏", "Unrealised P&L")}</small><strong className={bought ? 'academy-loss' : ''}>{bought ? '−200' : '0'}</strong></div></div>{bought && <p className="academy-trade-record"><Check size={14} />{tr("已模拟买入 20 × 100；剧情最新价 90", "Simulated purchase: 20 × 100; latest story price: 90")}</p>}</div>
        {finished && <div className="academy-earned"><Trophy size={18} />{tr("已获得「第一次实践」徽章", "Earned the First Practice badge")}</div>}
        <button className="academy-primary" onClick={() => finished ? setView('workspace') : update({ simulationStep: state.simulationStep + 1 })}>{finished ? tr("回到学习室", "Back to the study room") : scene.action}<ArrowRight size={18} /></button>
        <small className="academy-caption">{tr("公司、价格与情节均为虚构，仅用于学习。", "The company, prices, and story are fictional and for learning only.")}</small>
      </section>
    </div>
    <div className="academy-case-notes"><span className="academy-eyebrow">{tr("研究员手记", "RESEARCHER’S NOTES")}</span>{[tr("观察企业经营", "Observe the business"), tr("写下投入与风险规则", "Define spending and risk rules"), tr("执行模拟订单", "Place a simulated order"), tr("记录结果并复盘", "Record and review the result")].map((label, i) => <span key={label} className={state.simulationStep > i ? 'done' : ''}>{state.simulationStep > i ? <Check size={15} /> : <span className="academy-note-dot" />}{label}</span>)}</div>
  </div>
}
