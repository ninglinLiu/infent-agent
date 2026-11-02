"use client"

import { AcademyScene } from '@/components/academy/ImmersiveScene'
import { useAcademy } from '@/components/academy/AcademyProvider'
import { useView } from '../view-context'
import { ArrowRight } from 'lucide-react'
import { useAcademyLocale } from '@/components/academy/useAcademyLocale'
import { useLearning } from '@/components/academy/LearningProvider'
import { REPLAY_CASES } from '@/lib/academy/replay'

export function WorkspaceView() {
  const { state } = useAcademy()
  const { setView } = useView()
  const { tr, displayName, lang } = useAcademyLocale()
  const { data, error, retry, act } = useLearning()
  const lessonsDone = Math.min(3, Math.floor(state.lessonStep / 2))
  const replaysDone = REPLAY_CASES.filter(item => state.replays?.[item.id]).length
  const next = lessonsDone < 3 ? 'learning' as const : 'simulation' as const
  const label = lessonsDone === 0 ? tr('开始第一节短课', 'Start the first lesson') : lessonsDone < 3 ? tr('继续今天的学习', 'Continue learning') : tr('去走一段真实历史', 'Walk through real history')
  return <div className="study-page study-home">
    <section className="study-hero">
      <div className="study-hero-copy">
        <h1>{tr(`${displayName}，欢迎回到学习室。`, `Welcome to the study, ${displayName}.`)}</h1>
        <p>{tr('这里不背概念。用真实行情算一遍回撤和仓位，再回到 2008、2020 那些时刻，亲手做一次决定。', 'No memorizing here. Work out drawdown and position size on real prices, then go back to moments like 2008 and 2020 and make the call yourself.')}</p>
        <button type="button" className="study-btn primary" onClick={() => setView(next)}>{label}<ArrowRight size={16} /></button>
      </div>
      <div className="study-hero-scene"><AcademyScene mentor={lessonsDone >= 3 ? 'quant' : 'value'} compact /></div>
    </section>
    <div className="study-tracks">
      <button type="button" className="study-track" onClick={() => setView('learning')}>
        <h2>{tr('知识短课', 'Short lessons')}</h2>
        <p>{tr('回撤、仓位、分散。拖动真实行情，答对才算过。', 'Drawdown, position size, diversification. Drag through real prices; you pass by getting it right.')}</p>
        <div className="study-progress" role="progressbar" aria-label={tr('短课进度', 'Lesson progress')} aria-valuemin={0} aria-valuemax={3} aria-valuenow={lessonsDone}><i style={{ width: `${lessonsDone / 3 * 100}%` }} /></div>
        <span className="study-case-foot"><span>{lessonsDone} / 3 {tr('节完成', 'lessons complete')}</span><ArrowRight size={16} /></span>
      </button>
      <button type="button" className="study-track" onClick={() => setView('simulation')}>
        <h2>{tr('历史复盘', 'History replays')}</h2>
        <p>{REPLAY_CASES.map(item => item.name[lang === 'en' ? 'en' : 'zh']).join(lang === 'en' ? ', ' : '、')}。</p>
        <div className="study-progress" role="progressbar" aria-label={tr('复盘进度', 'Replay progress')} aria-valuemin={0} aria-valuemax={REPLAY_CASES.length} aria-valuenow={replaysDone}><i style={{ width: `${replaysDone / REPLAY_CASES.length * 100}%` }} /></div>
        <span className="study-case-foot"><span>{replaysDone} / {REPLAY_CASES.length} {tr('个案例完成', 'cases complete')}</span><ArrowRight size={16} /></span>
      </button>
    </div>
    {data.courses.filter(c => c.availability === 'internal' && c.allowed).map(c => <button key={c.id} type="button" className="study-legacy" onClick={() => { void act('start', '', c.id); setView('simulation') }}>{tr('进入内部解锁测试', 'Open internal access test')}</button>)}
    {error && <p role="alert">{error} <button type="button" onClick={() => void retry()}>{tr('重新加载', 'Retry')}</button></p>}
  </div>
}
