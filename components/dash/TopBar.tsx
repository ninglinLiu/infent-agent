"use client"

import { useView } from './view-context'
import { ArrowLeft, Leaf } from 'lucide-react'
import { BRAND } from '@/lib/brand'
import { LanguageSwitch } from '@/components/academy/LanguageSwitch'
import { useAcademyLocale } from '@/components/academy/useAcademyLocale'

export function TopBar({ onExit }: { onExit?: () => void }) {
  const { setView } = useView()
  const { tr, displayName } = useAcademyLocale()
  return <header className="academy-topbar"><button className="academy-brand academy-back" onClick={onExit} aria-label={tr('返回雨夜街角', 'Back to the rainy street')}><ArrowLeft size={17} /><span className="academy-logomark">Ω</span><span>{BRAND.short}</span><span className="academy-topbar-title">{tr('学习室', 'Study room')}</span></button><div className="academy-topbar-right"><LanguageSwitch /><span className="academy-demo-label"><Leaf size={14} /> {tr('学习与模拟空间', 'Learn and practise')}</span><button className="academy-profile" onClick={() => setView('settings')} aria-label={tr('打开个人设置', 'Open profile settings')}><span className="academy-avatar mint">{displayName.slice(0, 1)}</span><span>{displayName}</span><small>{tr('演示账户', 'Demo account')}</small></button></div></header>
}
