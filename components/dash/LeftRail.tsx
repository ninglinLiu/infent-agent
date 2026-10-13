"use client"

import { BookOpen, Compass, LayoutGrid, Settings, Sprout } from 'lucide-react'
import { useView, type ViewId } from './view-context'
import { useAcademy } from '@/components/academy/AcademyProvider'
import { useAcademyLocale } from '@/components/academy/useAcademyLocale'

const NAV: { id: ViewId; icon: typeof LayoutGrid; label: string; en: string; sub: string }[] = [
  { id: 'workspace', icon: LayoutGrid, label: '学习室', en: 'Study room', sub: 'STUDY ROOM' },
  { id: 'learning', icon: BookOpen, label: '知识学习', en: 'Learning', sub: 'LEARN' },
  { id: 'simulation', icon: Compass, label: '角色模拟', en: 'Role simulation', sub: 'PRACTICE' },
  { id: 'settings', icon: Settings, label: '设置', en: 'Settings', sub: 'SETTINGS' },
]

export function LeftRail() {
  const { view, setView } = useView()
  const { state } = useAcademy()
  const { tr } = useAcademyLocale()
  const progress = Math.round((Math.min(state.lessonStep, 6) + Math.min(state.simulationStep, 4)) / 10 * 100)
  return <aside className="academy-rail" aria-label="Dashboard navigation">
    <div className="academy-rail-label">{tr('你的学习室', 'YOUR STUDY ROOM')}</div>
    <nav>{NAV.map(({ id, icon: Icon, label, en, sub }) => <button key={id} aria-current={view === id ? 'page' : undefined} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon size={19} /><span>{tr(label, en)}<small>{sub}</small></span>{view === id && <i />}</button>)}</nav>
    <div className="academy-rail-progress"><Sprout size={27} /><strong>{tr('一点点，成为更好的自己。', 'A little wiser, every day.')}</strong><p>{tr('第一章 · 研究员的第一天', 'Chapter 1 · Your first day')}</p><div className="academy-progress-track" role="progressbar" aria-label={tr('章节进度', 'Chapter progress')} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><small>{progress}% {tr('已完成', 'complete')}</small></div>
    <div className="academy-rail-foot">{tr('慢慢来，每一步都算数。', 'Take your time. Every step counts.')}</div>
  </aside>
}
