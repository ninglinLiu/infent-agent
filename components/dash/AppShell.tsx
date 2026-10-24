"use client"

import { DashProvider } from '@/lib/dash-store'
import { NightStudy } from '@/components/academy/NightStudy'
import { AcademyProvider } from '@/components/academy/AcademyProvider'
import { useAccount } from '@/components/account/AccountProvider'

export function AppShell() {
  const { user, ready } = useAccount()
  if (!ready) return <div className="account-notice" role="status">正在打开街角 / Opening your workspace…</div>
  return <DashProvider key={user?.id ?? 'visitor'}><AcademyProvider><NightStudy /></AcademyProvider></DashProvider>
}
