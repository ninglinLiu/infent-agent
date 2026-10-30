"use client"

import { ViewProvider, useView, type ViewId } from '@/components/dash/view-context'
import { TopBar } from '@/components/dash/TopBar'
import { LeftRail } from '@/components/dash/LeftRail'
import { WorkspaceView } from '@/components/dash/views/WorkspaceView'
import { SettingsView } from '@/components/dash/views/SettingsView'
import { AcademyGate } from './AcademyGate'
import { useAcademy } from './AcademyProvider'
import { ExperienceMotion } from './ExperienceMotion'
import { LearningView } from './LearningView'
import { SimulationView } from './SimulationView'
import { useAcademyLocale } from './useAcademyLocale'
import { useEffect } from 'react'

function AcademyContent({ onExit, embedded, initialView }: { onExit: () => void; embedded: boolean; initialView: ViewId }) {
  const { view, setView } = useView()
  const { state, storageAvailable } = useAcademy()
  const { tr, lang } = useAcademyLocale()
  useEffect(() => { setView(initialView) }, [initialView, setView])
  const tabs: { id: ViewId; label: string }[] = [
    { id: 'workspace', label: tr('学习概览', 'Overview') },
    { id: 'learning', label: tr('知识短课', 'Lessons') },
    { id: 'simulation', label: tr('案例实践', 'Practice') },
    { id: 'settings', label: tr('学习偏好', 'Preferences') },
  ]
  return <div className={`academy-root academy-room${embedded ? ' academy-embedded' : ''}`} lang={lang === "en" ? "en" : "zh-CN"} data-presentation={state.presentation} data-reduced-motion={state.reducedMotion}>
    <ExperienceMotion />
    <AcademyGate onExit={onExit}>
      <div className="academy-shell">
        {embedded ? <nav className="unified-subnav" aria-label={tr('学习导航', 'Study navigation')}>{tabs.map(tab => <button type="button" key={tab.id} aria-current={view === tab.id ? 'page' : undefined} onClick={() => setView(tab.id)}>{tab.label}</button>)}</nav> : <TopBar onExit={onExit} />}
        <div className="academy-shell-body">
          {!embedded && <LeftRail />}
          <main className="academy-main" aria-label={tr("学习室内容", "Study room content")}>
            {!storageAvailable && <p className="academy-storage-notice" role="status">{tr("学习进度尚未同步，请重试保存。", "Learning progress has not synced. Please retry saving.")}</p>}
            <div key={view} data-academy-view={view}>
              {view === 'workspace' && <WorkspaceView />}
              {view === 'learning' && <LearningView />}
              {view === 'simulation' && <SimulationView />}
              {view === 'settings' && <SettingsView />}
            </div>
          </main>
        </div>
      </div>
    </AcademyGate>
  </div>
}

export function AcademyConsole({ initialView = 'workspace', onExit, embedded = false }: { initialView?: ViewId; onExit: () => void; embedded?: boolean }) {
  return <ViewProvider initialView={initialView}><AcademyContent onExit={onExit} embedded={embedded} initialView={initialView} /></ViewProvider>
}
