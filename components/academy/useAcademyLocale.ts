"use client"

import { useLang } from '@/lib/i18n'
import { academyDisplayName, getAcademyContent } from '@/lib/academy-content'
import { useAcademy } from './AcademyProvider'

export function useAcademyLocale() {
  const { lang, setLang } = useLang()
  const { state } = useAcademy()
  return {
    lang, setLang,
    tr: (zh: string, en: string) => lang === 'en' ? en : zh,
    content: getAcademyContent(lang),
    displayName: academyDisplayName(state.name, lang),
  }
}
