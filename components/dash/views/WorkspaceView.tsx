"use client"

import { AcademyScene } from '@/components/academy/ImmersiveScene'
import { useAcademy } from '@/components/academy/AcademyProvider'
import { useView } from '../view-context'
import { ArrowRight, BookOpen, Compass } from 'lucide-react'
import { useAcademyLocale } from '@/components/academy/useAcademyLocale'
import { useLearning } from '@/components/academy/LearningProvider'

export function WorkspaceView() {
  const { state } = useAcademy()
  const { setView } = useView()
  const { tr, displayName } = useAcademyLocale()
  const { data, ready, error, retry, select, act } = useLearning()
  const attempt = data.attempts.find(a => a.course_id === 'coca-cola')
  const completed = state.lessonStep >= 6 && attempt?.status === 'completed'
  return <div className="academy-learning-home">
    <section className="academy-welcome"><div><div className="academy-eyebrow">YOUR FIRST CHAPTER</div><h1>{tr(`${displayName}，欢迎回到学习室。`, `Welcome to the study, ${displayName}.`)}</h1><p>{completed ? tr('第一章已完成。带着你的学习方法，继续观察与思考。', 'Chapter one is complete. Keep observing, questioning, and learning.') : tr('先学会提问，再学会判断。两位导师正在等你。', 'Start with questions. Build your judgment. Your mentors are waiting.')}</p><button className="academy-primary" onClick={() => setView(state.lessonStep >= 6 ? 'simulation' : 'learning')}>{completed ? tr('查看我的实践记录', 'Review my practice') : state.lessonStep >= 6 ? tr('开始角色模拟', 'Start role simulation') : state.lessonStep > 0 ? tr('继续今天的学习', 'Continue learning') : tr('开始第一节短课', 'Start the first lesson')}<ArrowRight size={16} /></button></div><div className="academy-welcome-scene"><AcademyScene mentor={state.lessonStep >= 6 ? 'quant' : 'value'} compact /><span>{tr('价值的眼光 × 量化的思维', 'Value investing × Quant thinking')}</span></div></section>
    <div className="academy-page-heading"><div><div className="academy-eyebrow">LEARN AT YOUR OWN PACE</div><h2>{tr('今天，向前一小步。', 'One small step today.')}</h2><p>{tr('短课帮助你理解，故事让你亲手练习。', 'Build understanding with short lessons. Put it into practice through a story.')}</p></div></div>
    <div className="academy-study-cards">
      <button className="academy-study-card" onClick={() => setView('learning')}><BookOpen size={25} /><span className="academy-eyebrow">01 / LEARN</span><h3>{tr('知识短课', 'Short lessons')}</h3><p>{tr('价格与价值、风险意识、可检验的判断。', 'Price and value, risk awareness, and testable judgments.')}</p><span className="academy-study-card-foot">{Math.floor(state.lessonStep / 2)} / 3 {tr('节完成', 'lessons complete')}<ArrowRight size={18} /></span></button>
      <button className="academy-study-card" onClick={() => { if (attempt) void select(attempt.id); setView('simulation') }}><Compass size={25} /><span className="academy-eyebrow">02 / PRACTICE · {tr('免费体验', 'FREE')}</span><h3>{tr('可口可乐价值投资练习', 'Coca-Cola value investing')}</h3><p>{tr('四个场景完整免费：研究、估值、仓位和复盘。', 'Four free scenes: research, valuation, position sizing and reflection.')}</p><span className="academy-study-card-foot">{!ready ? tr('正在读取', 'Loading') : attempt?.status === 'completed' ? tr('已完成', 'Completed') : attempt ? tr(`继续学习 · 场景 0${attempt.scene}`, `Continue learning · Scene 0${attempt.scene}`) : tr('开始学习', 'Start learning')}<ArrowRight size={18} /></span></button>
      <div className="academy-study-card"><BookOpen size={25} /><span className="academy-eyebrow">03 / ADVANCED</span><h3>{tr('价值投资进阶案例包', 'Advanced value cases')}</h3><p>{tr('筹备中，暂不销售。¥39 一次性为内部测试价格，非正式售价。', 'In preparation, not for sale. ¥39 one-time is an internal test price, not a final price.')}</p><span className="academy-study-card-foot">{data.entitlements.some(e => e.package_id === 'value-advanced' && e.active) ? tr('已解锁 · 内容筹备中', 'Unlocked · Content in preparation') : tr('需要解锁 · 内容筹备中', 'Requires unlock · In preparation')}</span>{data.entitlements.some(e => e.package_id === 'value-advanced' && e.active && e.source === 'demo') && <small>{tr('演示权益，不代表付款', 'Demo access, not a payment')}</small>}
      {data.courses.filter(c => c.availability === 'internal' && c.allowed).map(c => <button key={c.id} className="academy-secondary" onClick={() => { void act('start', '', c.id); setView('simulation') }}>{tr('进入内部解锁测试', 'Open internal access test')}</button>)}</div>
    </div>
    {error && <p role="alert">{error} <button onClick={() => void retry()}>{tr('重新加载', 'Retry')}</button></p>}
  </div>
}
