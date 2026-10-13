"use client"

import { DashProvider } from '@/lib/dash-store'
import { NightStudy } from '@/components/academy/NightStudy'
import { AcademyProvider } from '@/components/academy/AcademyProvider'

export function AppShell() {
  return <DashProvider><AcademyProvider><NightStudy /></AcademyProvider></DashProvider>
}
