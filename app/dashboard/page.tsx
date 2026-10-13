import { AppShell } from "@/components/dash/AppShell"
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'omniAI · 雨夜学习室', description: '点击 omniAI 招牌进入行情与 AI 研究工作台，点击学习室进入导师短课与剧情模拟。' }

export default function DashboardPage() {
  return <AppShell />
}
