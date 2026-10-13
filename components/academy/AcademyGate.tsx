"use client"

import { useEffect, useRef, useState } from 'react'
import { BRAND } from '@/lib/brand'
import { ArrowRight, BookOpen, Check, Sparkles } from 'lucide-react'
import { LanguageSwitch } from './LanguageSwitch'
import { useAcademyLocale } from './useAcademyLocale'
import { useAcademy } from './AcademyProvider'
import { AcademyScene } from './ImmersiveScene'

export function AcademyGate({ children, onExit }: { children: React.ReactNode; onExit?: () => void }) {
  const { state, ready, update, storageAvailable } = useAcademy()
  const { tr, content: { story: STORY, mentors: MENTORS } } = useAcademyLocale()
  const [name, setName] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (state.name && state.storyStep < STORY.length) heading.current?.focus() }, [state.name, state.storyStep, STORY.length])
  if (!ready) return <div className="academy-loading" role="status">{tr("正在打开学习室…", "Opening the study room…")}</div>
  if (state.name && state.storyStep >= STORY.length) return <>{children}</>
  const story = STORY[Math.min(state.storyStep, STORY.length - 1)]
  const mentor = MENTORS[story.mentor]
  return <main className="academy-gate" data-reduced-motion={state.reducedMotion} data-stage={state.name && story.mentor === 'quant' ? 'hologram' : 'study'}>
    <header className="academy-gate-header"><button onClick={onExit} className="academy-brand academy-back" aria-label={tr("返回雨夜街角", "Back to the rainy street")}><span className="academy-logomark">Ω</span>{BRAND.short}<span className="academy-brand-divider" />{tr("学习室", "Study room")}</button><div className="academy-gate-tools"><LanguageSwitch /><button className="academy-style-toggle" onClick={onExit}>{tr("返回街角 · Esc", "Back to street · Esc")}</button><button className="academy-style-toggle" onClick={() => update({ presentation: state.presentation === 'immersive' ? 'classic' : 'immersive' })}>{state.presentation === 'immersive' ? tr("对比插画版", "Try the illustrated view") : tr("体验 3D 版", "Try the 3D view")}</button><span className="academy-pill">{tr("交互演示", "Interactive demo")}</span></div></header>
    <div className="academy-gate-grid">
      <section className="academy-gate-art">
        <div className="academy-art-kicker"><span /> A LITTLE WISER, EVERY DAY</div>
        <AcademyScene mentor={state.name ? story.mentor : 'value'} chapter={state.name ? state.storyStep + 1 : 0} />
        <div className="academy-art-caption"><span>THE INVESTOR’S STUDY</span><span>EST. 2026 ↗</span></div>
      </section>
      <section className="academy-gate-copy">
        {!state.name ? <div className="academy-enter">
          <div className="academy-eyebrow"><Sparkles size={14} />{tr("你的投资故事，从这里开始", "Your investing story starts here")}</div>
          <h1>{tr("学会思考，", "Learn to think.")}<br />{tr("再开始", "Then start ")}<span>{tr("投资。", "investing.")}</span></h1>
          {state.presentation === 'immersive' && <div className="academy-title-sticker">MEET YOUR MENTORS ↗</div>}
          <p className="academy-intro">{tr("走进一间书房，遇见两位导师。", "Step into a study and meet your mentors.")}<br />{tr("从第一个问题，到第一次模拟实践。", "From your first question to your first simulated trade.")}</p>
          <div className="academy-mentor-chips"><span><span className="academy-avatar gold">WB</span>{tr("巴菲特 · 价值投资", "Warren Buffett · Value investing")}</span><span><span className="academy-avatar mint">LC</span>{tr("林澈 · 量化研究", "Lin Che · Quant research")}</span></div>
          <form className="academy-login" onSubmit={e => { e.preventDefault(); update({ name: name.trim() || '新晋研究员' }) }}>
            <label htmlFor="researcher-name">{tr("怎么称呼你？", "What should we call you?")}<span>{tr("选填", "Optional")}</span></label>
            <input id="researcher-name" autoComplete="nickname" maxLength={20} placeholder={tr("你的研究员昵称", "Your researcher nickname")} value={name} onChange={e => setName(e.target.value)} />
            <button type="submit" className="academy-primary">{tr("以研究员身份进入", "Enter as a researcher")} <ArrowRight size={18} /></button>
            <p className="academy-caption">{tr("演示登录，无需密码。昵称与进度仅保存在此浏览器。", "Demo sign-in. No password needed. Your nickname and progress stay in this browser.")}</p>
          </form>
          <div className="academy-entry-foot"><BookOpen size={16} /><span>{tr("一段故事 · 三节短课 · 一次模拟实践", "One story · Three short lessons · One practice case")}</span></div>
        </div> : <div className="academy-story-copy academy-enter" key={state.storyStep}>
          <div className="academy-story-progress" aria-label={`${tr("序章", "Prologue")} ${state.storyStep + 1} / ${STORY.length}`}>{STORY.map((_, i) => <span key={i} className={i <= state.storyStep ? 'active' : ''} />)}<small>0{state.storyStep + 1} / 03</small></div>
          <div className="academy-eyebrow">{story.eyebrow}</div>
          <h1 ref={heading} tabIndex={-1}>{story.title.split('\n').map((line, i) => <span className="academy-title-line" key={i}>{line}</span>)}</h1>
          <div className="academy-speaker"><span className={`academy-avatar ${story.mentor === 'value' ? 'gold' : 'mint'}`}>{mentor.initials}</span><div><strong>{mentor.name}</strong><small>{mentor.role}</small></div><span className="academy-speaking-bars"><i /><i /><i /></span></div>
          <p className="academy-dialogue">{story.text}</p>
          <button className="academy-primary" onClick={() => update({ storyStep: state.storyStep + 1 })}>{story.action}<ArrowRight size={18} /></button>
          <p className="academy-caption"><Check size={13} />{tr("单线故事，按自己的节奏继续", "One story. Continue at your own pace.")}</p>
        </div>}
        {!storageAvailable && <p className="academy-storage-notice" role="status">{tr("浏览器暂不允许保存，当前体验可继续；刷新后进度可能丢失。", "Your browser cannot save progress. You can continue, but refreshing may lose your work.")}</p>}
        <p className="academy-persona-note">{tr("角色对白为虚构教学内容。巴菲特角色取材于其公开投资理念，并非本人对话或背书；林澈为原创角色。", "Dialogue is fictional and educational. The Buffett character draws on his public investing ideas, not personal dialogue or endorsement. Lin Che is an original character.")}</p>
      </section>
    </div>
  </main>
}
