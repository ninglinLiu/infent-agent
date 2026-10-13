import { AppShell } from "@/components/dash/AppShell"
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'omniAI · 雨夜学习室', description: '点击 omniAI 招牌进入行情与 AI 研究工作台，点击学習室进入导师学习室；CASE FILES 与 LESSONS 售货机分别打开案例练习与课程。' }

export default function DashboardPage() {
  return <AppShell />
}
