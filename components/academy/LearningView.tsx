"use client"

import { useEffect, useRef } from 'react'
import { ArrowRight, BookOpen, Check, CheckCircle2, Lock, Trophy } from 'lucide-react'
import { useAcademyLocale } from './useAcademyLocale'
import { useAcademy } from './AcademyProvider'
import { AcademyScene } from './ImmersiveScene'
import { useView } from '@/components/dash/view-context'

export function LearningView({ hideScene = false }: { hideScene?: boolean }) {
  const { state, update } = useAcademy()
  const { setView } = useView()
  const { tr, content: { lessons: LESSONS, mentors: MENTORS } } = useAcademyLocale()
  const complete = state.lessonStep >= LESSONS.length * 2
  const index = Math.min(Math.floor(state.lessonStep / 2), LESSONS.length - 1)
  const lesson = LESSONS[index]
  const checked = state.lessonStep % 2 === 1
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [state.lessonStep])
  return <div className="academy-page">
    <div className="academy-page-heading"><div><div className="academy-eyebrow">THE LEARNING PATH</div><h1>{tr("每天，读懂一点投资。", "Understand a little more, every day.")}</h1><p>{tr("不用一口气掌握所有知识。今天只向前走三小步。", "No need to learn everything at once. Today, take three small steps.")}</p></div><span className="academy-progress-badge"><BookOpen size={18} />{Math.floor(state.lessonStep / 2)} / 3 {tr("节完成", "lessons complete")}</span></div>
    <div className="academy-learning-grid">
      <aside className="academy-path" aria-label={tr("课程进度", "Lesson progress")}><span className="academy-eyebrow">{tr("第一章 / 从观察开始", "CHAPTER 1 / START BY OBSERVING")}</span>{LESSONS.map((item, i) => <div className={`academy-path-step ${i === index && !complete ? 'current' : ''} ${state.lessonStep >= (i + 1) * 2 ? 'done' : ''}`} key={item.title}><span className="academy-path-node">{state.lessonStep >= (i + 1) * 2 ? <Check size={18} /> : i > index ? <Lock size={15} /> : `0${i + 1}`}</span><div><strong>{item.title}</strong><small>{state.lessonStep >= (i + 1) * 2 ? tr("已掌握", "Complete") : i > index ? tr("完成上一节后开启", "Unlock after the previous lesson") : tr("正在学习 · ", "Learning · ") + item.duration}</small></div></div>)}<div className="academy-path-note">{tr("学完之后，带着这三个问题，", "Take these three questions")}<br />{tr("走进你的第一场模拟实践。", "into your first practice case.")}</div></aside>
      <section className="academy-lesson-card academy-enter" key={state.lessonStep}>
        {complete ? <div className="academy-complete"><span className="academy-trophy"><Trophy size={38} /></span><div className="academy-eyebrow">CHAPTER COMPLETE</div><h2 ref={heading} tabIndex={-1}>{tr("你已经准备好，亲手试一次。", "You’re ready to put it into practice.")}</h2><p>{tr("看企业、定风险、记依据。", "Study the business. Define risk. Record evidence.")}<br />{tr("把刚学到的知识带进可口可乐价值投资练习。", "Apply what you learned to the Coca-Cola value investing case.")}</p><div className="academy-earned"><CheckCircle2 size={18} />{tr("获得「认真观察者」徽章", "Earned the Thoughtful Observer badge")}</div><button className="academy-primary" onClick={() => setView('simulation')}>{tr("进入角色模拟", "Start role simulation")}<ArrowRight size={18} /></button></div> : <>
          <div className="academy-lesson-top"><span className="academy-eyebrow">{lesson.tag}</span><span className="academy-pill">{lesson.duration}</span></div><h2 ref={heading} tabIndex={-1}>{lesson.title}</h2><p className="academy-lesson-body">{lesson.body}</p>
          <div className="academy-example"><span>{tr("用一个例子理解", "A practical example")}</span><p>{lesson.example}</p></div>
          <div className="academy-question"><div className="academy-eyebrow">{tr("一起确认一下", "CHECK YOUR UNDERSTANDING")}</div><h3>{lesson.question}</h3>{!checked ? <button className="academy-answer" onClick={() => update({ lessonStep: state.lessonStep + 1 })}><span>A</span>{lesson.answer}<ArrowRight size={17} /></button> : <><div className="academy-feedback" role="status"><CheckCircle2 size={22} /><div><strong>{lesson.answer}</strong><p>{lesson.feedback}</p></div></div><button className="academy-primary" onClick={() => update({ lessonStep: state.lessonStep + 1 })}>{index === LESSONS.length - 1 ? tr("完成这一章", "Complete this chapter") : tr("继续下一节", "Continue to the next lesson")}<ArrowRight size={18} /></button></>}</div>
        </>}
      </section>
      {!hideScene && <aside className="academy-lesson-mentor"><AcademyScene mentor={lesson.mentor} compact /><div><span className="academy-eyebrow">{tr("你的学习搭档", "YOUR LEARNING PARTNER")}</span><h3>{MENTORS[lesson.mentor].name}</h3><p>{MENTORS[lesson.mentor].role}</p><blockquote>{tr("“把一个问题想清楚，就是今天的进步。”", "“Thinking one question through is progress for today.”")}</blockquote><small>{tr("虚构教学对白", "Fictional teaching dialogue")}</small></div></aside>}
    </div>
  </div>
}
