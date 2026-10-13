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

function AcademyContent({ onExit }: { onExit: () => void }) {
  const { view } = useView()
  const { state, storageAvailable } = useAcademy()
  const { tr, lang } = useAcademyLocale()
  return <div className="academy-root academy-room" lang={lang === "en" ? "en" : "zh-CN"} data-presentation={state.presentation} data-reduced-motion={state.reducedMotion}>
    <ExperienceMotion />
    <AcademyGate onExit={onExit}>
      <div className="academy-shell">
        <TopBar onExit={onExit} />
        <div className="academy-shell-body">
          <LeftRail />
          <main className="academy-main" aria-label={tr("学习室内容", "Study room content")}>
            {!storageAvailable && <p className="academy-storage-notice" role="status">{tr("当前浏览器无法保存学习进度，刷新后可能丢失。", "Your browser cannot save learning progress. Refreshing may lose your work.")}</p>}
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

export function AcademyConsole({ initialView = 'workspace', onExit }: { initialView?: ViewId; onExit: () => void }) {
  return <ViewProvider initialView={initialView}><AcademyContent onExit={onExit} /></ViewProvider>
}
