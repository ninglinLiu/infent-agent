"use client"

import { AcademyScene } from '@/components/academy/ImmersiveScene'
import { useAcademy } from '@/components/academy/AcademyProvider'
import { useView } from '../view-context'
import { ArrowRight, BookOpen, Compass } from 'lucide-react'
import { useAcademyLocale } from '@/components/academy/useAcademyLocale'

export function WorkspaceView() {
  const { state } = useAcademy()
  const { setView } = useView()
  const { tr, displayName } = useAcademyLocale()
  const completed = state.lessonStep >= 6 && state.simulationStep >= 4
  return <div className="academy-learning-home">
    <section className="academy-welcome"><div><div className="academy-eyebrow">YOUR FIRST CHAPTER</div><h1>{tr(`${displayName}，欢迎回到学习室。`, `Welcome to the study, ${displayName}.`)}</h1><p>{completed ? tr('第一章已完成。带着你的学习方法，继续观察与思考。', 'Chapter one is complete. Keep observing, questioning, and learning.') : tr('先学会提问，再学会判断。两位导师正在等你。', 'Start with questions. Build your judgment. Your mentors are waiting.')}</p><button className="academy-primary" onClick={() => setView(state.lessonStep >= 6 ? 'simulation' : 'learning')}>{completed ? tr('查看我的实践记录', 'Review my practice') : state.lessonStep >= 6 ? tr('开始角色模拟', 'Start role simulation') : state.lessonStep > 0 ? tr('继续今天的学习', 'Continue learning') : tr('开始第一节短课', 'Start the first lesson')}<ArrowRight size={16} /></button></div><div className="academy-welcome-scene"><AcademyScene mentor={state.lessonStep >= 6 ? 'quant' : 'value'} compact /><span>{tr('价值的眼光 × 量化的思维', 'Value investing × Quant thinking')}</span></div></section>
    <div className="academy-page-heading"><div><div className="academy-eyebrow">LEARN AT YOUR OWN PACE</div><h2>{tr('今天，向前一小步。', 'One small step today.')}</h2><p>{tr('短课帮助你理解，故事让你亲手练习。', 'Build understanding with short lessons. Put it into practice through a story.')}</p></div></div>
    <div className="academy-study-cards">
      <button className="academy-study-card" onClick={() => setView('learning')}><BookOpen size={25} /><span className="academy-eyebrow">01 / LEARN</span><h3>{tr('知识短课', 'Short lessons')}</h3><p>{tr('价格与价值、风险意识、可检验的判断。', 'Price and value, risk awareness, and testable judgments.')}</p><span className="academy-study-card-foot">{Math.floor(state.lessonStep / 2)} / 3 {tr('节完成', 'lessons complete')}<ArrowRight size={18} /></span></button>
      <button className="academy-study-card" onClick={() => setView('simulation')}><Compass size={25} /><span className="academy-eyebrow">02 / PRACTICE</span><h3>{tr('候鸟咖啡研究案', 'The Migratory Coffee case')}</h3><p>{tr('和导师一起观察、定规则、模拟实践、复盘。', 'Observe, set rules, simulate, and review with your mentors.')}</p><span className="academy-study-card-foot">{state.simulationStep >= 4 ? tr('已完成第一次实践', 'First practice complete') : `${state.simulationStep} / 4 ${tr('步完成', 'steps complete')}`}<ArrowRight size={18} /></span></button>
    </div>
  </div>
}
