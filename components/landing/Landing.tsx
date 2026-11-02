'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Languages } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { useLiveMarket } from '@/lib/market/live'
import { MarketBoard, OraclePanel } from '@/components/terminal/MarketBoard'
import { calmness, heartRate, MarketLayer, NarrativeLayer, NetworkLayer, NoiseBox, Skyline, SystemLog, useVisible } from './layers'

const HeartScene = dynamic(() => import('./HeartScene'), { ssr: false })

class SceneBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  return now
}

function useReducedMotion() {
  const [still, setStill] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setStill(media.matches)
    sync(); media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  return still
}

/** 隔几秒随机撕裂一下画面，减少动态效果时不触发 */
function useGlitch(enabled: boolean) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let id: ReturnType<typeof setTimeout>
    const loop = () => { id = setTimeout(() => { setOn(true); setTimeout(() => setOn(false), 180 + Math.random() * 160); loop() }, 3500 + Math.random() * 4500) }
    loop()
    return () => clearTimeout(id)
  }, [enabled])
  return on
}

export function Landing() {
  const { lang, setLang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const live = useLiveMarket()
  const now = useClock()
  const still = useReducedMotion()
  const hero = useRef<HTMLElement>(null)
  const visible = useVisible(hero)
  const [tabVisible, setTabVisible] = useState(true)
  useEffect(() => { const sync = () => setTabVisible(document.visibilityState === 'visible'); document.addEventListener('visibilitychange', sync); return () => document.removeEventListener('visibilitychange', sync) }, [])
  const active = visible && tabVisible
  const glitch = useGlitch(active && !still)
  const [layer, setLayer] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

  const vix = live.quotes.VIX?.price
  const bpm = heartRate(vix)
  const calm = calmness(vix)
  const spx = live.quotes.SPX
  const oracle = live.oracle.SPY ?? Object.values(live.oracle)[0]
  const logLines = useMemo(() => [
    tr('…扫描四层结构', '...scanning layers'),
    tr('…过滤叙事噪音', '...filtering narrative noise'),
    spx ? `...SPX ${spx.price.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${(spx.changePct ?? 0) >= 0 ? '+' : ''}${(spx.changePct ?? 0).toFixed(2)}%` : tr('…等待行情源', '...awaiting market feed'),
    oracle ? `...oracle ${oracle.pair} ${oracle.price.toLocaleString('en-US', { maximumFractionDigits: 2 })} · Chainlink` : tr('…读取链上喂价', '...reading on-chain feeds'),
    `...heart rate ${bpm} bpm${vix ? ` ← VIX ${vix.toFixed(2)}` : ''}`,
    tr('…agent 待命', '...agent standing by'),
  // 行情每 5 秒刷新，日志只在关键数字变化时重打
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [lang, spx?.price, oracle?.price, bpm, vix])

  const LAYERS = [
    { n: 3, name: tr('叙事 / 噪音', 'NARRATIVE / NOISE'), items: tr('社交热帖|观点气泡|模拟共识', 'social feed|speech bubbles|simulated consensus').split('|') },
    { n: 2, name: tr('市场 / 信号', 'MARKET / SIGNAL'), items: tr('实时报价|日内走势|回测', 'live quotes|intraday|backtests').split('|') },
    { n: 1, name: tr('协议 / 预言机', 'PROTOCOL / ORACLE'), items: tr('Chainlink 喂价|数据包|Agent 工具', 'chainlink feeds|data packets|agent tools').split('|') },
    { n: 0, name: tr('生命 / 你', 'BIO / YOU'), items: tr('本金|耐心|心跳', 'capital|conviction|heartbeat').split('|') },
  ]

  return <main className="lp" data-ready={ready} data-still={still}>
    <section ref={hero} className={`lp-hero ${glitch ? 'glitching' : ''}`} aria-label={tr('omniAI 首屏', 'omniAI hero')}>
      <Skyline />
      <div className="lp-heart-zone">
        <SceneBoundary><HeartScene bpm={bpm} active={active} still={still} onReady={() => setReady(true)} /></SceneBoundary>
      </div>

      <div className="lp-stack" onMouseLeave={() => setLayer(null)}>
        <div className={`lp-tier t3 ${layer === 3 ? 'hot' : ''}`} onMouseEnter={() => setLayer(3)}><NarrativeLayer lang={lang === 'en' ? 'en' : 'zh'} active={active && !still} /></div>
        <div className={`lp-tier t2 ${layer === 2 ? 'hot' : ''}`} onMouseEnter={() => setLayer(2)}><MarketLayer live={live} lang={lang === 'en' ? 'en' : 'zh'} /></div>
        <div className={`lp-tier t1 ${layer === 1 ? 'hot' : ''}`} onMouseEnter={() => setLayer(1)}><NetworkLayer live={live} active={active && !still} /></div>
        <div className="lp-tier t0" onMouseEnter={() => setLayer(0)} />
        <i className="lp-tear" aria-hidden="true" />
      </div>

      <header className="lp-brand"><span>✦</span><b>omniAI</b><small>{tr('金融研究 Agent', 'Financial research agent')}</small></header>

      <ol className="lp-hud-left" aria-label={tr('四层结构', 'Four layers')}>
        {LAYERS.map(item => <li key={item.n} className={`l${item.n} ${layer === item.n ? 'hot' : ''}`} onMouseEnter={() => setLayer(item.n)} onMouseLeave={() => setLayer(null)}>
          <b>LAYER {item.n}</b><span>{item.name}</span>{item.items.map(i => <small key={i}>&gt; {i}</small>)}
        </li>)}
      </ol>

      <div className="lp-hud-right">
        <nav className="lp-nav">
          <button type="button" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}><Languages size={14} />{lang === 'en' ? '中文' : 'EN'}</button>
          <Link href="/login">{tr('登录', 'Sign in')}</Link>
          <Link href="/dashboard" className="lp-nav-cta">{tr('进入街角', 'Enter')}<ArrowRight size={14} /></Link>
        </nav>
        <dl className="lp-meta">
          <div><dt>STRUCTURE ID</dt><dd>OMNI_4L_STACK</dd></div>
          <div><dt>CLASS</dt><dd>RESEARCH / AGENT</dd></div>
          <div><dt>FUNCTION</dt><dd>SIGNAL ← NOISE</dd></div>
          <div><dt>STATUS</dt><dd className={live.status === 'live' ? 'ok' : ''}>{live.status === 'live' ? 'ACTIVE' : live.status === 'error' ? 'DEGRADED' : 'BOOTING'}</dd></div>
          <div className="gap"><dt>TIME (NY)</dt><dd>{now ? new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now) : '--:--:--'}</dd></div>
          <div><dt>FEED</dt><dd>YAHOO · CHAINLINK</dd></div>
          <div><dt>HEART</dt><dd className="beat" style={{ ['--bpm' as string]: `${60 / bpm}s` }}>♥ {bpm} BPM</dd></div>
        </dl>
      </div>

      <div className="lp-headline">
        <h1 data-text={tr('穿过噪音，\n听见心跳。', 'Through the noise,\nhear the heartbeat.')}>{tr('穿过噪音，', 'Through the noise,')}<br /><em>{tr('听见心跳。', 'hear the heartbeat.')}</em></h1>
        <p>{tr('社交情绪、行情信号、链上数据，一层层拆开。omniAI 把一轮对话变成一份用真实价格回测过的策略书，再一键放进模拟沙箱。', 'Social mood, market signals and on-chain data, taken apart layer by layer. omniAI turns one conversation into a strategy backtested on real prices, then runs it in a paper sandbox.')}</p>
        <div className="lp-cta-row">
          <Link href="/dashboard?enter=workspace" className="lp-btn primary">{tr('和 Agent 聊一轮', 'Talk to the agent')}<ArrowRight size={16} /></Link>
          <Link href="/dashboard" className="lp-btn">{tr('先逛逛街角', 'Explore the corner')}</Link>
        </div>
        <small className="lp-note">{tr(`心率随 VIX 变化：市场越紧张，心跳越快。${vix ? `现在 VIX ${vix.toFixed(2)}。` : ''}`, `The heart rate follows the VIX: the more anxious the market, the faster it beats.${vix ? ` VIX now ${vix.toFixed(2)}.` : ''}`)}</small>
      </div>

      <div className="lp-log"><b>SYSTEM LOG &gt;&gt;&gt;</b><SystemLog lines={logLines} /><b className="lp-engaged">+++ OMNI AGENT ENGAGED +++</b></div>

      <div className="lp-signal">
        <div className="lp-box"><b>SIGNAL INTERFERENCE</b><NoiseBox active={active && !still} /></div>
        <div className="lp-box"><b>{tr('市场平静度', 'MARKET CALM')}</b><span>{calm === null ? '—' : `${calm.toFixed(1)}%`}<small>{tr('由 VIX 推算', 'from VIX')}</small></span><i><em style={{ width: `${calm ?? 0}%` }} /></i></div>
      </div>

      <a className="lp-scroll" href="#decode">{tr('向下，拆开它', 'Scroll to decode')}</a>
    </section>

    <section id="decode" className="lp-decode">
      <h2>{tr('四层，一层层拆开', 'Four layers, decoded')}</h2>
      <div className="lp-rows">
        <article>
          <span className="lp-idx">03</span>
          <div><h3>{tr('噪音不是信号', 'Noise is not signal')}</h3><p>{tr('热帖、喊单、「这次不一样」。Agent 只引用工具返回的真实数据，查不到就说查不到，不编一个数字。', 'Hot takes, calls, “this time is different.” The agent quotes only what its tools return. When data is missing, it says so instead of inventing a number.')}</p><Link href="/dashboard?enter=workspace">{tr('打开 AI 助手', 'Open the agent')}<ArrowUpRight size={15} /></Link></div>
        </article>
        <article>
          <span className="lp-idx">02</span>
          <div><h3>{tr('实时行情，两年回测', 'Live quotes, two-year backtests')}</h3><p>{tr('三十多个品种的实时报价。聊出来的策略书，用过去两年的真实复权日线回测：收益、最大回撤、夏普，和基准逐项对比。', 'Live quotes on 30+ instruments. Every strategy from the chat is backtested on two years of real adjusted prices: return, drawdown and Sharpe against a benchmark.')}</p><Link href="/dashboard?enter=markets">{tr('打开交易所', 'Open the exchange')}<ArrowUpRight size={15} /></Link></div>
          <div className="lp-widget term"><MarketBoard compact groups={['idx']} /></div>
        </article>
        <article>
          <span className="lp-idx">01</span>
          <div><h3>{tr('链上预言机交叉校验', 'Cross-checked on chain')}</h3><p>{tr('沙箱里的每一笔成交都用实时报价撮合，再和 Chainlink 链上喂价比对偏离，报价、喂价和滑点全部写进数据库留痕。', 'Each sandbox fill is priced on a live quote, then checked against Chainlink on-chain feeds. Quote, feed and slippage are all written to the ledger.')}</p></div>
          <div className="lp-widget term"><OraclePanel limit={5} /></div>
        </article>
        <article>
          <span className="lp-idx">00</span>
          <div><h3>{tr('稳住你的心跳', 'Keep your heartbeat steady')}</h3><p>{tr('学习室里，巴菲特陪你回到 2008、2020 那些时刻。只看得到当时能看到的东西，亲手做决定，再看结果。', 'In the study room, a Buffett mentor walks you back into 2008 and 2020. You see only what was visible then, make the call, and see what happened.')}</p><Link href="/dashboard?enter=academy">{tr('进入学习室', 'Enter the study room')}<ArrowUpRight size={15} /></Link></div>
          <div className="lp-widget lp-pulse"><b className="beat" style={{ ['--bpm' as string]: `${60 / bpm}s` }}>♥</b><span>{bpm}<small>BPM</small></span><em>{vix ? `VIX ${vix.toFixed(2)}` : 'VIX —'}</em></div>
        </article>
      </div>
    </section>

    <section className="lp-flow">
      <h2>{tr('一轮对话，从问题到成交', 'One conversation, from question to fill')}</h2>
      <ol>{[
        [tr('提问', 'Ask'), tr('说出本金、能承受的回撤和看法', 'Capital, drawdown limit, your view')],
        [tr('研究', 'Research'), tr('实时报价与驱动分析', 'Live quotes and driver analysis')],
        [tr('策略书', 'Strategy'), tr('结构化的标的与权重', 'Structured symbols and weights')],
        [tr('回测', 'Backtest'), tr('两年真实复权日线', 'Two years of real prices')],
        [tr('沙箱执行', 'Execute'), tr('实时撮合 + 预言机校验', 'Live fills + oracle check')],
        [tr('入账', 'Ledger'), tr('写进 Supabase，随时复盘', 'Written to Supabase')],
      ].map(([title, body], i) => <li key={title}><span>{String(i + 1).padStart(2, '0')}</span><b>{title}</b><small>{body}</small></li>)}</ol>
    </section>

    <section className="lp-final">
      <h2>{tr('推开街角那扇门。', 'Open the door on the corner.')}</h2>
      <p>{tr('一栋亮着灯的小楼：AI 助手、交易所和学习室都在里面。', 'A small lit building: the agent, the exchange and the study room are all inside.')}</p>
      <div className="lp-cta-row"><Link href="/dashboard" className="lp-btn primary">{tr('进入 omniAI', 'Enter omniAI')}<ArrowRight size={16} /></Link><Link href="/login" className="lp-btn">{tr('登录 / 注册', 'Sign in / Register')}</Link></div>
    </section>

    <footer className="lp-foot">
      <span>© omniAI</span>
      <span>{tr('模拟资金，不连接真实券商 · 教育用途，不构成投资建议', 'Paper money only, no real broker · Educational, not investment advice')}</span>
      <a href="https://github.com/ninglinLiu/infent-agent" target="_blank" rel="noreferrer">GitHub</a>
    </footer>
  </main>
}
