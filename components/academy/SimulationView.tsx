"use client"

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ClipboardList, Coffee } from 'lucide-react'
import { useAcademyLocale } from './useAcademyLocale'
import { ComicDialogue, ComicStage } from './ComicStage'
import { useAcademy } from './AcademyProvider'
import { useView } from '@/components/dash/view-context'
import { useLearning } from './LearningProvider'
import { money, noteIds, type LearningAction, type LocalText } from '@/lib/account/learning'

export function SimulationView({ hideScene = false }: { hideScene?: boolean }) {
  const { setView } = useView()
  const { tr, lang } = useAcademyLocale()
  const { state } = useAcademy()
  const { data, detail: loadedDetail, ready, busy, error, saved, pending, select, act, retry } = useLearning()
  const [retainedDetail,setRetainedDetail]=useState(loadedDetail)
  useEffect(()=>{if(loadedDetail)setRetainedDetail(loadedDetail)},[loadedDetail])
  const detail=loadedDetail??retainedDetail
  const [systemReduced,setSystemReduced]=useState(false)
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)'); const update=()=>setSystemReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[])
  const reduced=state.reducedMotion||systemReduced
  const reviewDialog=useRef<HTMLDialogElement>(null)
  const reviewRequested=useRef(false)
  const [reason, setReason] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const opened = useRef(false)
  const latest = data.attempts.find(a => a.course_id === 'coca-cola')
  useEffect(() => { if (ready && !opened.current) { opened.current = true; if (latest && !detail) void select(latest.id) } }, [ready, latest, detail, select])
  useEffect(() => { setReason(''); heading.current?.focus({preventScroll:true}) }, [detail?.attempt.id, detail?.attempt.revision])
  const a = detail?.attempt
  const content = detail?.content
  const scene = content?.scenes[(a?.scene ?? 1) - 1]
  const text = (value: LocalText) => value[lang]
  const last = detail?.choices[detail.choices.length - 1]
  const blocked = busy || pending
  useEffect(()=>{if(a?.status==='completed'&&reviewRequested.current){reviewRequested.current=false;reviewDialog.current?.showModal()}},[a?.status,a?.id])
  const wrongFirst=['wait_quarter','buy_80','sell_fear']
  const choices=scene?.choices.slice().sort((left,right)=>Number(wrongFirst.includes(right.id))-Number(wrongFirst.includes(left.id)))
  return <div className="academy-page comic-simulation" data-reduced={reduced} data-status={a?.status??'intro'}>
    <div className="academy-page-heading comic-heading"><div><div className="academy-eyebrow">OMNIAI / COMIC CASE FILES</div><h1>{tr('这次，轮到你做决定。', 'Your turn to make the call.')}</h1><p>{tr('可口可乐 · 四幕价值投资练习', 'Coca-Cola · A four-scene investing exercise')}</p></div><span className="academy-progress-badge"><Coffee size={18} />{a?.scene ?? 1} / 4 {tr('场景', 'scenes')}</span></div>
    <div className="academy-simulation-grid">
      {!hideScene && <ComicStage key={a?.id??'intro'} scene={a?.scene??1} lang={lang} stopped={a?.status==='stopped'||a?.status==='completed'} reduced={reduced}/>}
      <section className="academy-simulation-dialogue academy-enter">
        <div className="academy-eyebrow">{a?.status === 'completed' ? 'CASE CLOSED' : tr('场景', 'SCENE') + ' 0' + (a?.scene ?? 1) + ' / 04'}</div>
        <div className="academy-progress-track" role="progressbar" aria-label={tr('场景进度', 'Scene progress')} aria-valuemin={0} aria-valuemax={4} aria-valuenow={a?.status === 'completed' ? 4 : (a?.scene ?? 1) - 1}><span style={{ width: `${(a?.status === 'completed' ? 4 : (a?.scene ?? 1) - 1) * 25}%` }} /></div>
        <h2 ref={heading} tabIndex={-1}>{scene ? text(scene.title) : tr('开启你的研究尝试', 'Begin your research attempt')}</h2>
        {!a && !error && <p>{tr('每次选择都会保存至你的账号。重置会创建新尝试，保留旧记录。', 'Each choice is saved to your account. Reset creates a new attempt and keeps the old record.')}</p>}
        {scene && <><p>{text(scene.text)}</p><div className="comic-speaker">{tr('林澈 / 虚构教学角色','LIN CHE / FICTIONAL MENTOR')}</div><ComicDialogue key={`${a?.id}-${a?.scene}-${lang}`} text={text(scene.mentor)} reduced={reduced} label={tr('显示完整对白','Show full dialogue')}/></>}
        {a && <div className="academy-paper-account"><div className="academy-account-title"><ClipboardList size={16} />{tr('剧情模拟账户', 'Story simulation account')}<span>{tr('模拟币', 'Simulated credits')}</span></div><div className="academy-balance"><small>{tr('账户总值', 'Account value')}</small><strong data-testid="account-total">{money(a.total_cents)}</strong></div><div className="academy-account-details">
          {[[tr('可用余额', 'Available cash'), money(a.cash_cents)], [tr('持仓份额', 'Shares'), String(a.shares)], [tr('教学价格', 'Teaching price'), money(a.price_cents)], [tr('持仓浮盈亏', 'Unrealised P&L'), money(a.unrealized_cents)], [tr('已实现盈亏', 'Realised P&L'), money(a.realized_cents)]].map(([label,value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}
        </div></div>}
        {a?.status === 'stopped' && last && content?.feedback[last.action] && <div className="academy-feedback" role="status">{text(content.feedback[last.action])}</div>}
        {a?.status === 'completed' && <div className="academy-feedback"><Check size={18} /><div>{tr('复盘已保存，本次尝试已完成。', 'Review saved. This attempt is complete.')}<p>{a.review}</p></div></div>}
        <div className="academy-case-actions">
          {!a && ready && !latest && <button className="academy-primary" disabled={blocked} onClick={() => void act('start')}>{tr('开始学习', 'Start learning')}<ArrowRight size={18} /></button>}
          {a?.status === 'active' && <>
            {a.scene===4 ? <label className="academy-case-reason">{tr('你依据什么作出决定？出现什么变化时，你会重新评估或退出？','What informed your decision? What changes would make you reassess or exit?')}<textarea aria-label={tr('复盘','Review')} maxLength={2000} value={reason} disabled={blocked} onChange={e=>setReason(e.target.value)}/></label> : <details className="comic-reason"><summary>{tr('补充选择理由（选填）','Add your reasoning (optional)')}</summary><label className="academy-case-reason"><textarea aria-label={tr('选择理由','Choice reason')} maxLength={2000} value={reason} disabled={blocked} onChange={e=>setReason(e.target.value)}/></label></details>}
            {choices?.map((choice, i) => <button className="academy-answer" key={choice.id} data-choice={choice.id} disabled={blocked} onClick={() => void act(choice.id as LearningAction['action'], reason)}><span>{i === 0 ? 'A' : 'B'}</span>{text(choice.label)}<ArrowRight size={17} /></button>)}
            {a.scene === 4 && <button className="academy-primary" disabled={blocked || !reason.trim()} onClick={() => {reviewRequested.current=true;void act('review', reason)}}>{tr('完成本次模拟复盘', 'Complete this simulation review')}<Check size={18} /></button>}
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
        {content&&<details className="academy-caption comic-disclaimer"><summary>{tr('关于这个教学案例','About this teaching case')}</summary><p>{text(content.disclaimer)}</p></details>}
      </section>
    </div>
    <div className="academy-case-notes"><span className="academy-eyebrow">{tr('研究员手记', 'RESEARCHER’S NOTES')}</span>{content?.notes.map((label,i) => <span key={noteIds[i]} className={a?.notes.includes(noteIds[i]) ? 'done' : ''}>{a?.notes.includes(noteIds[i]) ? <Check size={15} /> : <span className="academy-note-dot" />}{text(label)}</span>)}</div>
    <dialog ref={reviewDialog} className="comic-review-modal" aria-labelledby="comic-review-title">
      <span className="comic-modal-kicker">CASE CLOSED / 04</span><h2 id="comic-review-title">{tr('把结果，变成下一次的判断。','Turn the outcome into better judgment.')}</h2>
      <p>{tr('你已走过研究护城河、估值、安全边际、仓位与复盘这条教学路径。一次盈利不代表方法已经被证明，保留你的判断依据，也记录什么变化会让你重新评估。','You explored the moat, valuation, margin of safety, position rules and review. One profitable result does not prove a method. Keep the evidence and record what would make you reassess.')}</p>
      <blockquote>{a?.review}</blockquote><button className="academy-primary" onClick={()=>reviewDialog.current?.close()}>{tr('收好这次复盘','Keep this review')}<Check size={16}/></button>
    </dialog>
  </div>
}
