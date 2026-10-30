"use client"

import { useView } from './view-context'
import { Leaf } from 'lucide-react'
import { BRAND } from '@/lib/brand'
import { LanguageSwitch } from '@/components/academy/LanguageSwitch'
import { useAcademyLocale } from '@/components/academy/useAcademyLocale'
import { BackToStreet } from '@/components/academy/BackToStreet'

export function TopBar({ onExit }: { onExit?: () => void }) {
  const { setView } = useView()
  const { tr, displayName } = useAcademyLocale()
  return <header className="academy-topbar">
    <div className="street-header-brand">
      <BackToStreet onExit={onExit} tone="paper" />
      <div className="academy-brand"><span className="academy-logomark">Ω</span><span>{BRAND.short}</span><span className="academy-topbar-title">{tr('学习室', 'Study room')}</span></div>
    </div>
    <div className="academy-topbar-right"><LanguageSwitch /><span className="academy-demo-label"><Leaf size={14} /> {tr('学习与模拟空间', 'Learn and practise')}</span><button className="academy-profile" onClick={() => setView('settings')} aria-label={tr('打开个人设置', 'Open profile settings')}><span className="academy-avatar mint">{displayName.slice(0, 1)}</span><span>{displayName}</span><small>{tr('个人账号', 'Personal account')}</small></button></div>
  </header>
}
