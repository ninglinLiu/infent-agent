"use client"

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, BookOpen, CandlestickChart, Home, Info, Languages, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { useDash } from '@/lib/dash-store'
import type { NightDestination } from '@/components/academy/night-navigation'
import { AgentChat } from './AgentChat'
import { QuantPreview } from './QuantPreview'
import { ToastLayer } from './ToastLayer'
import { AccountLink, RequireAccount } from '@/components/account/AccountAccess'

const RepositoryConsole = dynamic(() => import('./repository/RepositoryConsole').then(module => module.RepositoryConsole))
const AcademyConsole = dynamic(() => import('@/components/academy/AcademyConsole').then(module => module.AcademyConsole))

type Section = 'ai' | 'exchange' | 'study' | 'about'
export type WorkspaceEntry = { destination: NightDestination | 'about'; sequence: number }

function sectionFor(destination: WorkspaceEntry['destination']): Section {
  if (destination === 'about') return 'about'
  if (['academy', 'practice', 'lessons'].includes(destination)) return 'study'
  return destination === 'workspace' || destination === 'agent' ? 'ai' : 'exchange'
}

export function UnifiedWorkspace({ entry, onExit, visible }: { entry: WorkspaceEntry; onExit: () => void; visible: boolean }) {
  const { lang, setLang } = useLang()
  const { theme, setTheme } = useDash()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const [section, setSection] = useState<Section>(() => sectionFor(entry.destination))
  const [visited, setVisited] = useState<Partial<Record<Section, boolean>>>(() => ({ [sectionFor(entry.destination)]: true }))
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => { setTheme('light') }, [setTheme])

  useEffect(() => {
    const next = sectionFor(entry.destination)
    setSection(next)
    setVisited(previous => ({ ...previous, [next]: true }))
  }, [entry])

  useEffect(() => { if (visible) heading.current?.focus({ preventScroll: true }) }, [section, entry.sequence, visible])

  function navigate(next: Section) {
    setVisited(previous => ({ ...previous, [next]: true }))
    setSection(next)
  }

  const items = [
    { id: 'ai' as const, icon: Sparkles, label: tr('AI 助手', 'AI Agent'), subtitle: tr('先问一个好问题。', 'A good question is a good beginning.') },
    { id: 'exchange' as const, icon: CandlestickChart, label: tr('交易所', 'Exchange'), subtitle: tr('观察市场，检验你的想法。', 'Observe the market. Test your thinking.') },
    { id: 'study' as const, icon: BookOpen, label: tr('学习室', 'Study Room'), subtitle: tr('每天，多懂一点。', 'A little wiser, every day.') },
    { id: 'about' as const, icon: Info, label: tr('关于', 'About'), subtitle: tr('认识你的研究伙伴。', 'Meet your research companion.') },
  ]
  const current = items.find(item => item.id === section)!

  return <div className="unified-workspace" lang={lang === 'en' ? 'en' : 'zh-CN'} data-section={section} data-theme={theme} onKeyDown={event => {
    if (event.key === 'Escape' && !event.defaultPrevented && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) { event.preventDefault(); onExit() }
  }}>
    <nav className="unified-rail" aria-label={tr('主导航', 'Main navigation')}>
      <span className="unified-mark" aria-label="omniAI">✳</span>
      <div className="unified-rail-items">
        {items.map(({ id, icon: Icon, label }) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon size={22} strokeWidth={1.6} /><span>{label}</span></button>)}
      </div>
      <button type="button" className="unified-house" onClick={onExit}><Home size={22} strokeWidth={1.6} /><span>{tr('回到房子', 'House')}</span></button>
    </nav>
    <div className="unified-body">
      <header className="unified-header">
        <div className="unified-heading"><span className="unified-wordmark">omniAI</span><span className="unified-divider" /><h1 ref={heading} tabIndex={-1}>{current.label}</h1><span className="unified-subtitle">{current.subtitle}</span></div>
        <AccountLink /><button type="button" className="unified-language" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} aria-label={tr('切换为英文', 'Switch to Chinese')}><Languages size={16} />{lang === 'en' ? '中文' : 'English'}</button>
      </header>
      <div className="unified-content">
        {visited.ai && <section className="unified-panel unified-ai" hidden={section !== 'ai'} aria-label={tr('AI 对话', 'AI conversation')}>
          <div className="unified-chat"><RequireAccount><AgentChat /></RequireAccount></div>
          <QuantPreview active={visible && section === 'ai'} onOpen={() => navigate('exchange')} />
        </section>}
        {visited.exchange && <section className="unified-panel" hidden={section !== 'exchange'} aria-label={tr('交易所内容', 'Exchange content')}>
          <RepositoryConsole embedded initialView="markets" onExit={onExit} />
        </section>}
        {visited.study && <section className="unified-panel" hidden={section !== 'study'} aria-label={tr('学习室', 'Study Room')}>
          <RequireAccount><AcademyConsole embedded initialView={entry.destination === 'practice' ? 'simulation' : entry.destination === 'lessons' ? 'learning' : 'workspace'} onExit={onExit} /></RequireAccount>
        </section>}
        {visited.about && <section className="unified-panel unified-about" hidden={section !== 'about'} aria-label={tr('关于 omniAI', 'About omniAI')}>
          <div className="unified-about-copy"><span className="unified-eyebrow">THE CURIOUS CORNER</span><h2>{tr('让好奇心，', 'Follow your curiosity.')}<br /><em>{tr('变成理解。', 'Build your understanding.')}</em></h2><p>{tr('从一个问题开始。和 AI 一起研究，在交易所观察市场，再到学习室建立自己的判断。三个空间，一段连续的体验。', 'Start with a question. Research with AI, explore the market in Exchange, and build your judgment in the Study Room. Three spaces, one connected experience.')}</p><div className="unified-about-actions"><Link href="/about">{tr('完整产品介绍', 'Explore the product story')}<ArrowUpRight size={18} /></Link><a href="https://github.com/ninglinLiu/infent-agent" target="_blank" rel="noreferrer">GitHub<ArrowUpRight size={18} /></a></div></div>
          <div className="unified-about-grid">{items.slice(0, 3).map(({ id, icon: Icon, label, subtitle }, i) => <button type="button" key={id} onClick={() => navigate(id)}><span>0{i + 1}</span><Icon size={30} strokeWidth={1.3} /><h3>{label}</h3><p>{subtitle}</p><ArrowUpRight size={19} /></button>)}</div>
        </section>}
      </div>
    </div>
    <ToastLayer />
  </div>
}
