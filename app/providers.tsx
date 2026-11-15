"use client"

import { LangProvider } from "@/lib/i18n"
import { AccountProvider } from '@/components/account/AccountProvider'
import { LearningProvider } from '@/components/academy/LearningProvider'
import { LocalDemoBar } from '@/components/account/LocalDemoBar'

export function Providers({ children }: { children: React.ReactNode }) {
  return <LangProvider><LocalDemoBar /><AccountProvider><LearningProvider>{children}</LearningProvider></AccountProvider></LangProvider>
}
