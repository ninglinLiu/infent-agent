"use client"

import { Languages } from 'lucide-react'
import { useLang } from '@/lib/i18n'

export function LanguageSwitch() {
  const { lang, toggle } = useLang()
  return <button type="button" className="academy-language" onClick={toggle} aria-label={lang === 'zh' ? 'Switch to English' : '切换到中文'}>
    <Languages size={15} /><span>{lang === 'zh' ? 'English' : '中文'}</span>
  </button>
}
