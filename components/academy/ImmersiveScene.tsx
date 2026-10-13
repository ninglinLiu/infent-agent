"use client"

import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useRef, useState } from 'react'
import { Hand, MoveUpRight, ScanLine } from 'lucide-react'
import type { MentorId } from '@/lib/academy'
import { useAcademyLocale } from './useAcademyLocale'
import { MentorScene } from './MentorScene'
import { useAcademy } from './AcademyProvider'
import type { WorldInput } from './StudyWorld'

const StudyWorld = dynamic(() => import('./StudyWorld'), { ssr: false })

class SceneBoundary extends Component<{ children: React.ReactNode; fallback: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function ImmersiveScene({ mentor = 'value', chapter = 0, compact = false }: { mentor?: MentorId; chapter?: number; compact?: boolean }) {
  const { state } = useAcademy()
  const { tr, content: { mentors: MENTORS } } = useAcademyLocale()
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<WorldInput>({ x: 0, y: 0, scroll: 0 })
  const [supported, setSupported] = useState<boolean | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [active, setActive] = useState(true)
  const [systemStill, setSystemStill] = useState(false)
  const [wave, setWave] = useState(0)
  const [greeting, setGreeting] = useState(false)
  const onReady = useCallback(() => setLoaded(true), [])
  const onFailure = useCallback(() => setSupported(false), [])
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      setSupported(Boolean(gl))
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch { setSupported(false) }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setSystemStill(preference.matches)
    sync(); preference.addEventListener('change', sync)
    let inView = true
    const visibility = () => setActive(inView && document.visibilityState === 'visible')
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; visibility() }, { rootMargin: '80px' })
    if (root.current) observer.observe(root.current)
    document.addEventListener('visibilitychange', visibility)
    return () => { preference.removeEventListener('change', sync); observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => {
    if (!greeting) return
    const timer = setTimeout(() => setGreeting(false), 2600)
    return () => clearTimeout(timer)
  }, [greeting, wave])
  useEffect(() => {
    if (state.reducedMotion || systemStill) return
    const onScroll = () => {
      if (root.current) input.current.scroll = Math.max(-1, Math.min(1, -root.current.getBoundingClientRect().top / window.innerHeight))
    }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [state.reducedMotion, systemStill])
  const fallback = <div className="world-fallback"><MentorScene mentor={mentor} compact={compact} /><span>{tr("轻量插画模式", "Lightweight illustrated view")}</span></div>
  return <div ref={root} className={`immersive-scene ${compact ? 'is-compact' : ''}`} data-world={mentor === 'quant' ? 'hologram' : 'study'} data-ready={loaded && supported ? 'true' : 'false'}
    onPointerMove={event => {
      if (event.pointerType === 'touch') return
      const box = event.currentTarget.getBoundingClientRect()
      input.current.x = ((event.clientX - box.left) / box.width - .5) * 2
      input.current.y = ((event.clientY - box.top) / box.height - .5) * 2
    }} onPointerLeave={() => { input.current.x = 0; input.current.y = 0 }}>
    <div className="world-orbits" aria-hidden="true"><div className="world-orbit world-orbit-one" /><div className="world-orbit world-orbit-two" /></div>
    <div className="world-canvas" role="img" aria-label={mentor === 'quant' ? tr("量化导师的蓝色全息实验室，人物会随鼠标转头", "A quant mentor in a blue holographic lab, following your pointer") : tr("巴菲特式导师的立体书房，书桌、绿植和研究屏幕", "A Buffett-inspired mentor in a 3D study with a desk, plants, and research screen")}>
      <SceneBoundary fallback={fallback}>
        {supported === true && <StudyWorld mentor={mentor} chapter={chapter} still={state.reducedMotion || systemStill} active={active} wave={wave} input={input} onReady={onReady} onFailure={onFailure} />}
        {(!supported || !loaded) && <div className="world-loading-art">{fallback}</div>}
      </SceneBoundary>
    </div>
    <div className="world-number">{mentor === 'quant' ? '02' : '01'}<span>THE MENTOR</span></div>
    {!compact && <>
      <div className="world-label world-label-person"><span className="world-label-dot" /><div><strong>{MENTORS[mentor].name}</strong><small>{MENTORS[mentor].role}</small></div><MoveUpRight size={15} /></div>
      <div className="world-label world-label-note" key={mentor}>{mentor === 'quant' ? <><ScanLine size={17} /><div><strong>{tr("让假设，接受检验。", "Put hypotheses to the test.")}</strong><small>HYPOTHESIS → EVIDENCE</small></div></> : <><span className="world-book-icon">↗</span><div><strong>{tr("价格 ≠ 价值", "Price ≠ Value")}</strong><small>THINK IN DECADES</small></div></>}</div>
      {greeting && <div className="world-greeting" role="status">{mentor === 'quant' ? tr("准备好验证第一个想法了吗？", "Ready to test your first idea?") : tr("你好，研究员。慢慢来，一起想清楚。", "Hello, researcher. Take your time. Let’s think it through together.")}</div>}
      <div className="world-bottom"><span>{supported === false ? tr("当前设备使用轻量插画", "Using the lightweight illustration") : tr("移动鼠标，和导师对视", "Move your pointer to meet your mentor’s gaze")}</span><button className="world-wave" onClick={() => { setWave(v => v + 1); setGreeting(true) }} aria-label={tr("和导师打个招呼", "Wave to your mentor")}><Hand size={16} />{tr("打个招呼", "Say hello")}</button></div>
    </>}
  </div>
}

export function AcademyScene(props: { mentor?: MentorId; chapter?: number; compact?: boolean }) {
  const { state } = useAcademy()
  return state.presentation === 'classic' ? <MentorScene {...props} /> : <ImmersiveScene {...props} />
}
