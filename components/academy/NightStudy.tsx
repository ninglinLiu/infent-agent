"use client"

import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, BookOpen, CandlestickChart, Languages, RotateCcw, Sparkles } from 'lucide-react'
import type { NightDestination } from './night-navigation'
import { useLang } from '@/lib/i18n'
import type { WorkspaceEntry } from '@/components/dash/UnifiedWorkspace'
import { AccountLink } from '@/components/account/AccountAccess'

const NightWorld = dynamic(() => import('./NightWorld'), { ssr: false })
const UnifiedWorkspace = dynamic(() => import('@/components/dash/UnifiedWorkspace').then(module => module.UnifiedWorkspace), { ssr: false })

class NightBoundary extends Component<{ children: React.ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

export function NightStudy() {
  const { lang, setLang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(true)
  const [still, setStill] = useState(false)
  const [reset, setReset] = useState(0)
  const [focus, setFocus] = useState<NightDestination | null>(null)
  const [entry, setEntry] = useState<WorkspaceEntry | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scene = useRef<HTMLDivElement>(null)
  const onReady = useCallback(() => setLoaded(true), [])
  const onFailure = useCallback(() => setFailed(true), [])
  const openAbout = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    document.body.style.cursor = ''
    setEntry(previous => ({ destination: 'about', sequence: (previous?.sequence ?? 0) + 1 }))
    setOpen(true)
  }, [])

  const enter = useCallback((next: NightDestination) => {
    setEntry(previous => ({ destination: next, sequence: (previous?.sequence ?? 0) + 1 }))
    setFocus(next)
    document.body.style.cursor = ''
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), failed || still ? 0 : 850)
  }, [failed, still])

  const close = useCallback((value: boolean) => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(value)
    if (!value) { setFocus(null); setReset(n => n + 1); requestAnimationFrame(() => scene.current?.focus({ preventScroll: true })) }
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

  return <main className="night-study night-hub" data-scene-ready={loaded && !failed}>
    <div className="night-home" hidden={open}>
    <header className="night-hub-header"><div><span className="night-hub-mark">✦</span><strong>omniAI</strong><span>{tr('好奇心的街角', 'The curious corner')}</span></div><div><AccountLink /><button type="button" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}><Languages size={17} />{lang === 'en' ? '中文' : 'English'}</button></div></header>
    <div ref={scene} className="night-scene" tabIndex={0} role="button" aria-label={tr("拖动旋转，滚轮缩放；点击 omniAI 进入工作台，学習室进入学习室；CASE FILES 售货机进入案例练习，LESSONS 售货机进入课程，门口 ABOUT 立牌打开产品宣传页。Enter 打开 omniAI，L 打开学习室，C 打开案例，K 打开课程，A 打开宣传页，Esc 还原视角", "Drag to rotate, scroll to zoom. Click omniAI for research, the study sign for the study room, CASE FILES for practice, LESSONS for courses, or the ABOUT board for our product showcase. Enter opens omniAI, L opens the study room, C opens cases, K opens lessons, A opens the showcase, Esc resets the view.")} onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); enter('workspace') }
      if (event.key.toLowerCase() === 'l') { event.preventDefault(); enter('academy') }
      if (event.key.toLowerCase() === 'c') { event.preventDefault(); enter('practice') }
      if (event.key.toLowerCase() === 'k') { event.preventDefault(); enter('lessons') }
      if (event.key.toLowerCase() === 'a') { event.preventDefault(); openAbout() }
      if (event.key.toLowerCase() === 'e') { event.preventDefault(); enter('markets') }
      if (event.key === 'Escape') { setFocus(null); setReset(n => n + 1); if (timer.current) clearTimeout(timer.current) }
    }}>
      {!failed && <NightBoundary onFailure={onFailure}><NightWorld onOpen={enter} onAbout={openAbout} still={still} active={active && !open} onReady={onReady} onFailure={onFailure} reset={reset} focus={focus} /></NightBoundary>}
    </div>
    {!loaded && !failed && <p className="sr-only" role="status">{tr("正在点亮 omniAI 与学习室", "Lighting up omniAI and the study room")}</p>}
    {failed && <div className="night-fallback"><p role="status">{tr('3D 场景暂不可用，请通过卡片继续。', 'The 3D scene is unavailable. Continue through the cards.')}</p></div>}
    <div className="night-hub-cards" aria-label={tr('探索三个空间', 'Explore three spaces')}>
      {[
        { id: 'workspace' as const, icon: Sparkles, tag: 'YOUR FINANCIAL AGENT', title: tr('你好，我是 omniAI。', 'Hi, I’m omniAI.'), body: tr('和 AI 一起理解市场、寻找研究依据，让每一个判断都更有底气。', 'Understand markets, explore investment ideas, and make more informed decisions with your AI research companion.'), action: tr('聊聊你的想法', 'Let’s talk investing') },
        { id: 'academy' as const, icon: BookOpen, tag: 'A LITTLE WISER, EVERY DAY', title: tr('我是你的学习室。', 'I’m the study room.'), body: tr('跟随巴菲特与量化导师学习，积累知识，再到模拟实践中试一试。', 'Learn with Buffett and a quant mentor. Build your knowledge, then try it in a simulation.'), action: tr('一起学习', 'Let’s learn together') },
        { id: 'markets' as const, icon: CandlestickChart, tag: 'A WINDOW INTO THE MARKET', title: tr('看见市场的脉搏。', 'Meet the Exchange.'), body: tr('探索 K 线、策略和研究工作台。在一个地方观察、记录与复盘。', 'Explore charts, strategies, and your workspace. Observe, journal, and reflect in one place.'), action: tr('探索交易所', 'Explore the market') },
      ].map(({ id, icon: Icon, tag, title, body, action }) => <button type="button" key={id} className={`night-entry-card night-entry-card--${id}`} onClick={() => enter(id)}><div className="night-card-kicker"><span><Icon size={23} strokeWidth={1.6} /></span><small>{tag}</small></div><h2>{title}</h2><p>{body}</p><span className="night-card-action">{action}<ArrowUpRight size={19} /></span></button>)}
    </div>
    <footer className="night-hub-footer"><span>{tr('拖动旋转 · 滚轮缩放 · 点击卡片或招牌探索', 'Drag to rotate · Scroll to zoom · Pick a card or sign to explore')}</span><button type="button" onClick={() => { setFocus(null); setReset(n => n + 1) }}><RotateCcw size={14} />{tr('还原视角', 'Reset view')}</button></footer>
    </div>
    {entry && <div className="night-unified-layer" hidden={!open}><UnifiedWorkspace entry={entry} visible={open} onExit={() => close(false)} /></div>}
  </main>
}
