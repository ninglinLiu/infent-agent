"use client"

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ClipboardList, Coffee } from 'lucide-react'
import { useAcademyLocale } from './useAcademyLocale'
import { AcademyScene } from './ImmersiveScene'
import { useView } from '@/components/dash/view-context'
import { useLearning } from './LearningProvider'
import { money, noteIds, type LearningAction, type LocalText } from '@/lib/account/learning'

export function SimulationView({ hideScene = false }: { hideScene?: boolean }) {
  const { setView } = useView()
  const { tr, lang, content: { mentors } } = useAcademyLocale()
  const { data, detail, ready, busy, error, saved, pending, select, act, retry } = useLearning()
  const [reason, setReason] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const opened = useRef(false)
  const latest = data.attempts.find(a => a.course_id === 'coca-cola')
  useEffect(() => { if (ready && !opened.current) { opened.current = true; if (latest && !detail) void select(latest.id) } }, [ready, latest, detail, select])
  useEffect(() => { setReason(''); heading.current?.focus() }, [detail?.attempt.id, detail?.attempt.revision])
  const a = detail?.attempt
  const content = detail?.content
  const scene = content?.scenes[(a?.scene ?? 1) - 1]
  const text = (value: LocalText) => value[lang]
  const last = detail?.choices[detail.choices.length - 1]
  const blocked = busy || pending
  return <div className="academy-page">
    <div className="academy-page-heading"><div><div className="academy-eyebrow">LEARN BY DOING</div><h1>{tr('成为故事里的研究员。', 'Step into the researcher’s shoes.')}</h1><p>{tr('可口可乐价值投资练习 · 完整免费案例', 'Coca-Cola value investing · Complete free case')}</p></div><span className="academy-progress-badge"><Coffee size={18} />{a?.scene ?? 1} / 4 {tr('场景', 'scenes')}</span></div>
    <div className="academy-simulation-grid">
      {!hideScene && <section className="academy-simulation-stage"><AcademyScene mentor="quant" chapter={(a?.scene ?? 1) - 1} /><div className="academy-scene-label"><span className="academy-live-dot" />{mentors.quant.name}<small>{mentors.quant.role} · {tr('虚构教学角色', 'Fictional teaching character')}</small></div></section>}
      <section className="academy-simulation-dialogue academy-enter">
        <div className="academy-eyebrow">{a?.status === 'completed' ? 'CASE CLOSED' : tr('场景', 'SCENE') + ' 0' + (a?.scene ?? 1) + ' / 04'}</div>
        <div className="academy-progress-track" role="progressbar" aria-label={tr('场景进度', 'Scene progress')} aria-valuemin={0} aria-valuemax={4} aria-valuenow={a?.status === 'completed' ? 4 : (a?.scene ?? 1) - 1}><span style={{ width: `${(a?.status === 'completed' ? 4 : (a?.scene ?? 1) - 1) * 25}%` }} /></div>
        <h2 ref={heading} tabIndex={-1}>{scene ? text(scene.title) : tr('开启你的研究尝试', 'Begin your research attempt')}</h2>
        {!a && !error && <p>{tr('每次选择都会保存至你的账号。重置会创建新尝试，保留旧记录。', 'Each choice is saved to your account. Reset creates a new attempt and keeps the old record.')}</p>}
        {scene && <><p>{text(scene.text)}</p><blockquote>{text(scene.mentor)}</blockquote></>}
        {content && <small className="academy-caption">{text(content.disclaimer)}</small>}
        {a && <div className="academy-paper-account"><div className="academy-account-title"><ClipboardList size={16} />{tr('剧情模拟账户', 'Story simulation account')}<span>{tr('模拟币', 'Simulated credits')}</span></div><div className="academy-balance"><small>{tr('账户总值', 'Account value')}</small><strong data-testid="account-total">{money(a.total_cents)}</strong></div><div className="academy-account-details">
          {[[tr('可用余额', 'Available cash'), money(a.cash_cents)], [tr('持仓份额', 'Shares'), String(a.shares)], [tr('教学价格', 'Teaching price'), money(a.price_cents)], [tr('持仓浮盈亏', 'Unrealised P&L'), money(a.unrealized_cents)], [tr('已实现盈亏', 'Realised P&L'), money(a.realized_cents)]].map(([label,value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}
        </div></div>}
        {a?.status === 'stopped' && last && content?.feedback[last.action] && <div className="academy-feedback" role="status">{text(content.feedback[last.action])}</div>}
        {a?.status === 'completed' && <div className="academy-feedback"><Check size={18} /><div>{tr('复盘已保存，本次尝试已完成。', 'Review saved. This attempt is complete.')}<p>{a.review}</p></div></div>}
        <div className="academy-case-actions">
          {!a && ready && !latest && <button className="academy-primary" disabled={blocked} onClick={() => void act('start')}>{tr('开始学习', 'Start learning')}<ArrowRight size={18} /></button>}
          {a?.status === 'active' && <>
            <label className="academy-case-reason">{a.scene === 4 ? tr('你依据什么作出决定？出现什么变化时，你会重新评估或退出？', 'What informed your decision? What changes would make you reassess or exit?') : tr('选择理由（选填）', 'Reason for your choice (optional)')}<textarea aria-label={a.scene === 4 ? tr('复盘', 'Review') : tr('选择理由', 'Choice reason')} maxLength={2000} value={reason} disabled={blocked} onChange={e => setReason(e.target.value)} /></label>
            {scene?.choices.map((choice, i) => <button className="academy-answer" key={choice.id} data-choice={choice.id} disabled={blocked} onClick={() => void act(choice.id as LearningAction['action'], reason)}><span>{i === 0 ? 'A' : 'B'}</span>{text(choice.label)}<ArrowRight size={17} /></button>)}
            {a.scene === 4 && <button className="academy-primary" disabled={blocked || !reason.trim()} onClick={() => void act('review', reason)}>{tr('完成本次模拟复盘', 'Complete this simulation review')}<Check size={18} /></button>}
          </>}
          {a && <button className="academy-secondary" disabled={blocked || (latest?.id !== a.id && a.course_id === 'coca-cola')} onClick={() => void act('reset')}>{tr('重置模拟', 'Reset simulation')}</button>}
          {a?.status === 'completed' && <button className="academy-primary" onClick={() => setView('workspace')}>{tr('回到学习室', 'Back to the study room')}<ArrowRight size={18} /></button>}
        </div>
        {busy && <p role="status">{tr('正在保存…', 'Saving…')}</p>}
        {saved && !busy && !error && <p role="status">{tr('已保存到你的账号', 'Saved to your account')}</p>}
        {error && <div role="alert"><p>{error}</p><button className="academy-secondary" disabled={busy} onClick={() => void retry()}>{tr('重试保存或加载', 'Retry save or load')}</button></div>}
        {!ready && !error && <p role="status">{tr('正在读取学习记录…', 'Loading learning records…')}</p>}
        {data.attempts.length > 0 && <label className="academy-caption">{tr('历史尝试', 'Attempt history')}<select aria-label={tr('历史尝试', 'Attempt history')} disabled={blocked} value={a?.id ?? ''} onChange={e => void select(e.target.value)}><option value="" disabled>{tr('选择尝试', 'Select an attempt')}</option>{data.attempts.map(attempt => <option key={attempt.id} value={attempt.id}>{attempt.started_at.slice(0,19).replace('T',' ')} · {attempt.course_id} · {attempt.status} · {attempt.script_version}</option>)}</select></label>}
        {!!detail?.choices.length && <details className="academy-caption"><summary>{tr('本次选择记录', 'Choices in this attempt')}</summary><ol>{detail.choices.map(choice => {
          const label = content?.scenes[choice.scene - 1]?.choices.find(item => item.id === choice.action)?.label
          return <li key={choice.id}><strong>{tr('场景', 'Scene')} {choice.scene} · {label ? text(label) : tr('提交复盘', 'Review submitted')}</strong><p>{choice.reason || tr('未填写理由', 'No reason entered')}</p><small>{new Date(choice.created_at).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}</small></li>
        })}</ol></details>}
      </section>
    </div>
    <div className="academy-case-notes"><span className="academy-eyebrow">{tr('研究员手记', 'RESEARCHER’S NOTES')}</span>{content?.notes.map((label,i) => <span key={noteIds[i]} className={a?.notes.includes(noteIds[i]) ? 'done' : ''}>{a?.notes.includes(noteIds[i]) ? <Check size={15} /> : <span className="academy-note-dot" />}{text(label)}</span>)}</div>
  </div>
}
