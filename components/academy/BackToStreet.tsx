"use client"

import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { useLang } from '@/lib/i18n'

export function BackToStreet({ onExit, tone = 'dark' }: { onExit?: () => void; tone?: 'dark' | 'paper' }) {
  const { lang } = useLang()
  const label = lang === 'en' ? 'Back to street' : '返回街角'
  const className = `street-return street-return--${tone}`
  const content = <><ArrowLeft size={15} aria-hidden="true" /><Home size={16} aria-hidden="true" /><span>{label}</span></>

  return onExit
    ? <button type="button" className={className} onClick={onExit} title={lang === 'en' ? 'Return to the 3D house · Esc' : '回到 3D 房子 · Esc'}>{content}</button>
    : <Link href="/dashboard" className={className}>{content}</Link>
}
