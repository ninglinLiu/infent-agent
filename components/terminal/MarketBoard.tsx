'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLiveMarket, type LiveState } from '@/lib/market/live'
import { assetName, findAsset } from '@/lib/market/universe'
import { useLang } from '@/lib/i18n'
import { ago, Delta, FlashNumber, fmtPct, fmtPrice, LiveDot, Panel, Sparkline } from './primitives'

export const BOARD_GROUPS: Array<{ id: string; zh: string; en: string; symbols: string[] }> = [
  { id: 'idx', zh: '全球指数', en: 'Global indices', symbols: ['SPX', 'NDX', 'HSI', 'CSI300', 'N225'] },
  { id: 'macro', zh: '宏观与商品', en: 'Macro & commodities', symbols: ['US10Y', 'VIX', 'DXY', 'XAU', 'WTI', 'USDCNH'] },
  { id: 'us', zh: '美股与 ETF', en: 'US equities & ETFs', symbols: ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'META', 'GOOGL', 'TSM', 'AMD', 'SPY', 'QQQ', 'GLD', 'TLT', 'SOXX'] },
  { id: 'hk', zh: '港股', en: 'Hong Kong', symbols: ['2800.HK', '0700.HK', '9988.HK'] },
  { id: 'crypto', zh: '加密（仅行情）', en: 'Crypto (data only)', symbols: ['BTC', 'ETH'] },
]

function seriesFor(live: LiveState, symbol: string) {
  const quote = live.quotes[symbol]
  if (!quote) return []
  const ticks = (live.ticks[symbol] ?? []).map(t => t.price)
  const base = quote.spark.length ? quote.spark : []
  return base.length && ticks.length && ticks[ticks.length - 1] !== base[base.length - 1] ? [...base, ticks[ticks.length - 1]] : base.length ? base : ticks
}

export function QuoteTile({ symbol, live, onPick, compact = false }: { symbol: string; live: LiveState; onPick?: (symbol: string) => void; compact?: boolean }) {
  const { lang } = useLang()
  const asset = findAsset(symbol)
  const quote = live.quotes[symbol]
  const series = seriesFor(live, symbol)
  const chg = quote?.changePct ?? 0
  return <button type="button" className={`t-tile ${compact ? 't-tile-compact' : ''}`} onClick={() => onPick?.(symbol)} disabled={!onPick} title={asset ? assetName(asset, lang) : symbol}>
    <span className="t-tile-top"><span className="t-sym">{symbol}</span><LiveDot status={quote ? quote.open ? 'open' : 'closed' : 'idle'} /></span>
    {!compact && <span className="t-tile-name">{asset ? assetName(asset, lang) : ''}</span>}
    <FlashNumber value={quote?.price} flash={live.flashes[symbol]} className="t-tile-price">{quote ? fmtPrice(quote.price, symbol) : <span className="t-skel" />}</FlashNumber>
    <span className="t-tile-foot"><Delta value={quote?.changePct} />{series.length > 1 && <Sparkline values={series} width={compact ? 54 : 70} height={compact ? 16 : 20} tone={chg >= 0 ? 'up' : 'down'} />}</span>
  </button>
}

export function MarketBoard({ onPick, groups = BOARD_GROUPS.map(g => g.id), compact = false }: { onPick?: (symbol: string) => void; groups?: string[]; compact?: boolean }) {
  const live = useLiveMarket()
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const [, setNow] = useState(0)
  useEffect(() => { const id = setInterval(() => setNow(n => n + 1), 1000); return () => clearInterval(id) }, [])
  return <Panel code="MKT" title={tr('全球行情 · 实时', 'Global markets · live')} right={<><LiveDot status={live.status} /><span>{live.status === 'error' ? tr('行情源暂不可用', 'Feed unavailable') : live.updatedAt ? `Yahoo Finance · ${ago(live.updatedAt, lang)}` : tr('连接中…', 'Connecting…')}</span></>} className="t-board">
    {BOARD_GROUPS.filter(g => groups.includes(g.id)).map(group => <div className="t-group" key={group.id}>
      <div className="t-group-label">{lang === 'en' ? group.en : group.zh}</div>
      <div className={`t-grid ${compact ? 't-grid-compact' : ''}`}>{group.symbols.map(symbol => <QuoteTile key={symbol} symbol={symbol} live={live} onPick={onPick} compact={compact} />)}</div>
    </div>)}
  </Panel>
}

export function TickerTape() {
  const live = useLiveMarket()
  const items = useMemo(() => BOARD_GROUPS.flatMap(g => g.symbols).filter(s => live.quotes[s]), [live.quotes])
  if (!items.length) return <div className="t-tape t-tape-empty" aria-hidden="true" />
  const row = items.map(symbol => {
    const q = live.quotes[symbol]
    return <span className="t-tape-item" key={symbol}><b>{symbol}</b><FlashNumber value={q.price} flash={live.flashes[symbol]}>{fmtPrice(q.price, symbol)}</FlashNumber><span className={(q.changePct ?? 0) >= 0 ? 't-up' : 't-down'}>{fmtPct(q.changePct)}</span></span>
  })
  return <div className="t-tape" aria-label="ticker"><div className="t-tape-track">{row}{row.map((node, i) => <span key={`dup-${i}`} aria-hidden="true">{node}</span>)}</div></div>
}

const CLOCKS = [
  { city: 'New York', zh: '纽约', tz: 'America/New_York', quote: 'SPX' },
  { city: 'London', zh: '伦敦', tz: 'Europe/London', quote: null, hours: [[8 * 60, 16 * 60 + 30]] },
  { city: 'Hong Kong', zh: '香港', tz: 'Asia/Hong_Kong', quote: 'HSI' },
  { city: 'Shanghai', zh: '上海', tz: 'Asia/Shanghai', quote: 'CSI300' },
  { city: 'Tokyo', zh: '东京', tz: 'Asia/Tokyo', quote: 'N225' },
] as const

function scheduleOpen(tz: string, hours: readonly (readonly number[])[], now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  if (['Sat', 'Sun'].includes(get('weekday'))) return false
  const minutes = (Number(get('hour')) % 24) * 60 + Number(get('minute'))
  return hours.some(([a, b]) => minutes >= a && minutes < b)
}

export function WorldClocks() {
  const live = useLiveMarket()
  const { lang } = useLang()
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  return <div className="t-clocks">{CLOCKS.map(clock => {
    const open = clock.quote ? live.quotes[clock.quote]?.open ?? false : now ? scheduleOpen(clock.tz, 'hours' in clock ? clock.hours : [], now) : false
    return <div className="t-clock" key={clock.city}>
      <span className="t-clock-time">{now ? new Intl.DateTimeFormat('en-GB', { timeZone: clock.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now) : '--:--:--'}</span>
      <span className="t-clock-city"><LiveDot status={open ? 'open' : 'closed'} />{lang === 'en' ? clock.city : clock.zh}<small>{open ? (lang === 'en' ? 'OPEN' : '交易中') : (lang === 'en' ? 'CLOSED' : '休市')}</small></span>
    </div>
  })}</div>
}

export function OraclePanel({ limit = 14 }: { limit?: number }) {
  const live = useLiveMarket()
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const rows = Object.values(live.oracle).slice(0, limit)
  return <Panel code="ORC" title={tr('Chainlink 链上预言机', 'Chainlink on-chain oracle')} right={<span>Arbitrum One · latestRoundData()</span>} className="t-oracle">
    {!rows.length ? <p className="t-empty">{tr('正在读取链上喂价…', 'Reading on-chain feeds…')}</p> : <table className="t-table">
      <thead><tr><th>{tr('交易对', 'Pair')}</th><th>{tr('链上价', 'On-chain')}</th><th>{tr('实时报价', 'Quote')}</th><th>{tr('偏离', 'Dev.')}</th><th>{tr('更新', 'Updated')}</th></tr></thead>
      <tbody>{rows.map(r => {
        const q = live.quotes[r.symbol]
        const dev = q ? q.price / r.price - 1 : null
        return <tr key={r.symbol}>
          <td><span className="t-sym">{r.pair}</span></td>
          <td className="t-num">{fmtPrice(r.price, r.symbol)}</td>
          <td><FlashNumber value={q?.price} flash={live.flashes[r.symbol]}>{fmtPrice(q?.price, r.symbol)}</FlashNumber></td>
          <td><span className="t-devbar"><i style={{ width: `${Math.min(100, Math.abs(dev ?? 0) / 0.02 * 100)}%` }} className={Math.abs(dev ?? 0) > 0.02 ? 'warn' : ''} /></span><span className="t-num t-dim">{dev === null ? '—' : fmtPct(dev, 2, true)}</span></td>
          <td className="t-dim">{ago(r.updatedAt, lang)}</td>
        </tr>
      })}</tbody>
    </table>}
  </Panel>
}
