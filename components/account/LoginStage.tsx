'use client'

import dynamic from 'next/dynamic'
import { Component, useEffect, useState } from 'react'
import { TickerTape } from '@/components/terminal/MarketBoard'
import { useLang } from '@/lib/i18n'

const NightWorld = dynamic(() => import('@/components/academy/NightWorld'), { ssr: false })

class StageBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

const noop = () => {}

/** 登录页左半边：小幅摆动的房子 + 实时行情带。窄屏不加载 3D，省流量也省电。 */
export function LoginStage() {
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const [mode, setMode] = useState<{ wide: boolean; still: boolean; failed: boolean }>({ wide: false, still: false, failed: false })
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1000px)'), motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setMode(previous => ({ ...previous, wide: wide.matches, still: motion.matches }))
    sync()
    wide.addEventListener('change', sync); motion.addEventListener('change', sync)
    return () => { wide.removeEventListener('change', sync); motion.removeEventListener('change', sync) }
  }, [])
  return <aside className="login-stage" aria-hidden={!mode.wide}>
    <div className="login-scene">{mode.wide && !mode.failed && <StageBoundary><NightWorld onOpen={noop} onAbout={noop} still={mode.still} active onReady={noop} onFailure={() => setMode(previous => ({ ...previous, failed: true }))} reset={0} focus={null} sway /></StageBoundary>}</div>
    <div className="login-brand"><span>✦</span><strong>omniAI</strong><small>{tr('好奇心的街角', 'The curious corner')}</small></div>
    <div className="login-pitch">
      <h2>{tr('聊一轮，', 'One conversation,')}<br /><em>{tr('出一份能跑起来的策略。', 'one strategy you can run.')}</em></h2>
      <ul>
        <li><b>{tr('实时研究', 'Live research')}</b>{tr('行情与链上预言机', 'Quotes & on-chain oracle')}</li>
        <li><b>{tr('两年回测', 'Two-year backtest')}</b>{tr('真实复权日线', 'Real adjusted prices')}</li>
        <li><b>{tr('沙箱执行', 'Sandbox execution')}</b>{tr('模拟资金，无真实交易', 'Paper money only')}</li>
      </ul>
    </div>
    <div className="login-tape term"><TickerTape /></div>
  </aside>
}
