import type { Metadata } from 'next'
import { Landing } from '@/components/landing/Landing'

export const metadata: Metadata = {
  title: 'omniAI · 穿过噪音，听见心跳',
  description: '金融研究 Agent：一轮对话生成策略书，用两年真实价格回测，再在模拟沙箱里按实时报价成交，并用 Chainlink 链上预言机交叉校验。',
}

export default function HomePage() {
  return <Landing />
}
