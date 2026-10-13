"use client"

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Component, useCallback, useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { NightDestination } from './night-navigation'
import { useLang } from '@/lib/i18n'

const NightWorld = dynamic(() => import('./NightWorld'), { ssr: false })
const RepositoryConsole = dynamic(() => import('@/components/dash/repository/RepositoryConsole').then(module => module.RepositoryConsole), { ssr: false })
const AcademyConsole = dynamic(() => import('./AcademyConsole').then(module => module.AcademyConsole), { ssr: false })

class NightBoundary extends Component<{ children: React.ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

export function NightStudy() {
  const router = useRouter()
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(true)
  const [still, setStill] = useState(false)
  const [reset, setReset] = useState(0)
  const [focus, setFocus] = useState<NightDestination | null>(null)
  const [destination, setDestination] = useState<NightDestination>('workspace')
  const inAcademy = destination === 'academy' || destination === 'practice' || destination === 'lessons'
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scene = useRef<HTMLDivElement>(null)
  const onReady = useCallback(() => setLoaded(true), [])
  const onFailure = useCallback(() => setFailed(true), [])
  const openAbout = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    document.body.style.cursor = ''
    router.push('/')
  }, [router])

  const enter = useCallback((next: NightDestination) => {
    setDestination(next)
    setFocus(next)
    document.body.style.cursor = ''
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), failed || still ? 0 : 850)
  }, [failed, still])

  const close = useCallback((value: boolean) => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(value)
    if (!value) { setFocus(null); setReset(n => n + 1) }
  }, [])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setStill(media.matches)
    const visible = () => setActive(document.visibilityState === 'visible')
    sync(); visible()
    media.addEventListener('change', sync)
    document.addEventListener('visibilitychange', visible)
    return () => {
      media.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', visible)
      document.body.style.cursor = ''
    }
  }, [])

  return <main className="night-study" data-scene-ready={loaded && !failed}>
    <div ref={scene} className="night-scene" tabIndex={0} role="button" aria-label={tr("拖动旋转，滚轮缩放；点击 omniAI 进入工作台，学習室进入学习室；CASE FILES 售货机进入案例练习，LESSONS 售货机进入课程，门口 ABOUT 立牌打开产品宣传页。Enter 打开 omniAI，L 打开学习室，C 打开案例，K 打开课程，A 打开宣传页，Esc 还原视角", "Drag to rotate, scroll to zoom. Click omniAI for research, the study sign for the study room, CASE FILES for practice, LESSONS for courses, or the ABOUT board for our product showcase. Enter opens omniAI, L opens the study room, C opens cases, K opens lessons, A opens the showcase, Esc resets the view.")} onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); enter('workspace') }
      if (event.key.toLowerCase() === 'l') { event.preventDefault(); enter('academy') }
      if (event.key.toLowerCase() === 'c') { event.preventDefault(); enter('practice') }
      if (event.key.toLowerCase() === 'k') { event.preventDefault(); enter('lessons') }
      if (event.key.toLowerCase() === 'a') { event.preventDefault(); openAbout() }
      if (event.key === 'Escape') { setFocus(null); setReset(n => n + 1); if (timer.current) clearTimeout(timer.current) }
    }}>
      {!failed && <NightBoundary onFailure={onFailure}><NightWorld onOpen={enter} onAbout={openAbout} still={still} active={active && !open} onReady={onReady} onFailure={onFailure} reset={reset} focus={focus} /></NightBoundary>}
    </div>
    {!loaded && !failed && <p className="sr-only" role="status">{tr("正在点亮 omniAI 与学习室", "Lighting up omniAI and the study room")}</p>}
    {failed && <div className="night-fallback"><p>{tr("3D 场景暂不可用", "The 3D scene is unavailable")}</p><button onClick={() => enter('workspace')}>{tr("进入 omniAI 工作台", "Enter omniAI")}</button><button onClick={() => enter('academy')}>{tr("进入学习室", "Enter the study room")}</button><Link href="/">{tr("了解 omniAI · 产品宣传页", "About omniAI · Product showcase")}</Link></div>}
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="night-console-overlay" />
        <Dialog.Content className="night-console" onCloseAutoFocus={event => { event.preventDefault(); scene.current?.focus({ preventScroll: true }) }}>
          <Dialog.Title className="sr-only">{inAcademy ? tr("omniAI 学习室", "omniAI Study room") : tr("omniAI 工作台", "omniAI Workspace")}</Dialog.Title>
          <Dialog.Description className="sr-only">{tr("omniAI 提供行情与 AI 研究，学习室提供导师、短课与剧情模拟。按 Esc 或点击返回按钮回到房子。", "omniAI offers market data and AI research. The study room offers mentors, lessons, and a guided simulation. Press Esc or use the back button to return to the building.")}</Dialog.Description>
          {destination === 'academy' || destination === 'practice' || destination === 'lessons'
            ? <AcademyConsole initialView={destination === 'practice' ? 'simulation' : destination === 'lessons' ? 'learning' : 'workspace'} onExit={() => close(false)} />
            : <RepositoryConsole initialView={destination} onExit={() => close(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </main>
}
