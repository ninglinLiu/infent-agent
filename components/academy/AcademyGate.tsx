"use client"

import { useEffect, useRef, useState } from 'react'
import { BRAND } from '@/lib/brand'
import { ArrowRight, BookOpen, Check, Sparkles } from 'lucide-react'
import { LanguageSwitch } from './LanguageSwitch'
import { useAcademyLocale } from './useAcademyLocale'
import { useAcademy } from './AcademyProvider'
import { AcademyScene } from './ImmersiveScene'
import { BackToStreet } from './BackToStreet'

export function AcademyGate({ children, onExit }: { children: React.ReactNode; onExit?: () => void }) {
  const { state, ready, update, storageAvailable } = useAcademy()
  const { tr, content: { story: STORY, mentors: MENTORS } } = useAcademyLocale()
  const [name, setName] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (state.name && state.storyStep < STORY.length) heading.current?.focus() }, [state.name, state.storyStep, STORY.length])
  if (!ready) return <div className="academy-loading" role="status">{tr("正在打开学习室…", "Opening the study room…")}</div>
  if (state.name && state.storyStep >= STORY.length) return <>{children}</>
  // Keep persisted step IDs stable: step 1 (retired mentor intro) advances to 2.
  const visibleSteps = [0, 2]
  const currentStep = state.storyStep === 0 ? 0 : 2
  const displayStep = visibleSteps.indexOf(currentStep)
  const story = STORY[currentStep]
  const mentor = MENTORS[story.mentor]
  return <main className="academy-gate" data-reduced-motion={state.reducedMotion} data-stage={state.name && story.mentor === 'quant' ? 'hologram' : 'study'}>
    <header className="academy-gate-header">
      <div className="street-header-brand"><BackToStreet onExit={onExit} tone="paper" /><div className="academy-brand"><span className="academy-logomark">Ω</span>{BRAND.short}<span className="academy-brand-divider" />{tr("学习室", "Study room")}</div></div>
      <div className="academy-gate-tools"><LanguageSwitch /><button className="academy-style-toggle" onClick={() => update({ presentation: state.presentation === 'immersive' ? 'classic' : 'immersive' })}>{state.presentation === 'immersive' ? tr("对比插画版", "Try the illustrated view") : tr("体验 3D 版", "Try the 3D view")}</button><span className="academy-pill">{tr("交互演示", "Interactive demo")}</span></div>
    </header>
    <div className="academy-gate-grid">
      <section className="academy-gate-art">
        <div className="academy-art-kicker"><span /> A LITTLE WISER, EVERY DAY</div>
        <AcademyScene mentor={state.name ? story.mentor : 'value'} chapter={state.name ? displayStep + 1 : 0} />
        <div className="academy-art-caption"><span>THE INVESTOR’S STUDY</span><span>EST. 2026 ↗</span></div>
      </section>
      <section className="academy-gate-copy">
        {!state.name ? <div className="academy-enter">
          <div className="academy-eyebrow"><Sparkles size={14} />{tr("你的投资故事，从这里开始", "Your investing story starts here")}</div>
          <h1>{tr("学会思考，", "Learn to think.")}<br />{tr("再开始", "Then start ")}<span>{tr("投资。", "investing.")}</span></h1>
          {state.presentation === 'immersive' && <div className="academy-title-sticker">MEET YOUR MENTOR ↗</div>}
          <p className="academy-intro">{tr("走进一间书房，学习价值投资。", "Step into a study and explore value investing.")}<br />{tr("从第一个问题，到第一次模拟实践。", "From your first question to your first simulated trade.")}</p>
          <div className="academy-mentor-chips"><span><span className="academy-avatar gold">WB</span>{tr("巴菲特 · 价值投资", "Warren Buffett · Value investing")}</span></div>
          <form className="academy-login" onSubmit={e => { e.preventDefault(); update({ name: name.trim() || '新晋研究员' }) }}>
            <label htmlFor="researcher-name">{tr("怎么称呼你？", "What should we call you?")}<span>{tr("选填", "Optional")}</span></label>
            <input id="researcher-name" autoComplete="nickname" maxLength={20} placeholder={tr("你的研究员昵称", "Your researcher nickname")} value={name} onChange={e => setName(e.target.value)} />
            <button type="submit" className="academy-primary">{tr("以研究员身份进入", "Enter as a researcher")} <ArrowRight size={18} /></button>
            <p className="academy-caption">{tr("设置学习昵称，进度将保存在你的账号中。", "Choose a study nickname. Progress is saved to your account.")}</p>
          </form>
          <div className="academy-entry-foot"><BookOpen size={16} /><span>{tr("一段故事 · 三节短课 · 一次模拟实践", "One story · Three short lessons · One practice case")}</span></div>
        </div> : <div className="academy-story-copy academy-enter" key={state.storyStep}>
          <div className="academy-story-progress" aria-label={`${tr("序章", "Prologue")} ${displayStep + 1} / ${visibleSteps.length}`}>{visibleSteps.map((_, i) => <span key={i} className={i <= displayStep ? 'active' : ''} />)}<small>0{displayStep + 1} / 02</small></div>
          <div className="academy-eyebrow">{story.eyebrow}</div>
          <h1 ref={heading} tabIndex={-1}>{story.title.split('\n').map((line, i) => <span className="academy-title-line" key={i}>{line}</span>)}</h1>
          <div className="academy-speaker"><span className={`academy-avatar ${story.mentor === 'value' ? 'gold' : 'mint'}`}>{mentor.initials}</span><div><strong>{mentor.name}</strong><small>{mentor.role}</small></div><span className="academy-speaking-bars"><i /><i /><i /></span></div>
          <p className="academy-dialogue">{story.text}</p>
          <button className="academy-primary" onClick={() => update({ storyStep: currentStep === 0 ? 2 : STORY.length })}>{story.action}<ArrowRight size={18} /></button>
          <p className="academy-caption"><Check size={13} />{tr("单线故事，按自己的节奏继续", "One story. Continue at your own pace.")}</p>
        </div>}
        {!storageAvailable && <p className="academy-storage-notice" role="status">{tr("云端保存失败，请点击同步提示中的重试。", "Cloud save failed. Use Retry in the sync notice.")}</p>}
        <p className="academy-persona-note">{tr("角色对白为虚构教学内容。巴菲特角色取材于其公开投资理念，并非本人对话或背书。", "Dialogue is fictional and educational. The Buffett character draws on his public investing ideas, not personal dialogue or endorsement.")}</p>
      </section>
    </div>
  </main>
}
