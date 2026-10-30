"use client"

import { useEffect, useId, useState } from 'react'
import { ArrowUpRight, CandlestickChart, RefreshCw } from 'lucide-react'
import { useDash } from '@/lib/dash-store'
import { useLang } from '@/lib/i18n'
import type { Candle, KlinePayload } from '@/lib/market/types'
import { INTERVALS } from '@/lib/market/types'

// Decorative fallback is always labelled as a simulation, never as a live quote.
const illustration: Candle[] = Array.from({ length: 30 }, (_, i) => {
  const open = 32 + i * .8 + Math.sin(i * .7) * 6
  const close = open + Math.cos(i * 1.8) * 4
  return { time: i, open, close, high: Math.max(open, close) + 3, low: Math.min(open, close) - 2, volume: 20 + Math.abs(Math.cos(i * 2)) * 80 }
})

export function QuantPreview({ active, onOpen }: { active: boolean; onOpen: () => void }) {
  const { lang } = useLang()
  const { chartInstrument, chartInterval } = useDash()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const [snapshot, setSnapshot] = useState<{ key: string; data: KlinePayload } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reload, setReload] = useState(0)
  const gradient = useId().replace(/:/g, '')
  const key = `${chartInstrument.symbol}:${chartInterval}`
  const data = snapshot?.key === key ? snapshot.data : null

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    const params = new URLSearchParams({ symbol: chartInstrument.symbol, interval: chartInterval })
    for (const field of ['secid', 'yahoo', 'market', 'name', 'nameEn', 'tv'] as const) {
      if (chartInstrument[field]) params.set(field, chartInstrument[field]!)
    }
    if (chartInstrument.timeZone) params.set('tz', chartInstrument.timeZone)
    let cancelled = false
    setStatus('loading')
    fetch(`/api/market/klines?${params}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Market unavailable')
        const result = await response.json() as KlinePayload
        if (!result.candles?.length || !Number.isFinite(result.quote?.price)) throw new Error('No market data')
        if (!cancelled) { setSnapshot({ key, data: result }); setStatus('ready') }
      })
      .catch(() => { if (!cancelled) setStatus('error') })
      .finally(() => window.clearTimeout(timeout))
    return () => { cancelled = true; window.clearTimeout(timeout); controller.abort() }
  }, [active, chartInstrument, chartInterval, key, reload])

  const candles = data?.candles.slice(-30) ?? illustration
  const low = Math.min(...candles.map(candle => candle.low))
  const high = Math.max(...candles.map(candle => candle.high))
  const maxVolume = Math.max(1, ...candles.map(candle => candle.volume))
  const y = (value: number) => 106 - (value - low) / (high - low || 1) * 86
  const path = candles.map((candle, index) => `${index ? 'L' : 'M'}${8 + index * 6.3},${y(candle.close)}`).join(' ')

  return <aside className="quant-preview" aria-label={tr('行情与策略预览', 'Market and strategy preview')}>
    <div className="quant-caption"><span className="quant-dot" />{tr('市场一瞥', 'MARKET PULSE')}</div>
    <section className="quant-market">
      <header><CandlestickChart size={16} /><span>{chartInstrument.symbol}</span><small>{INTERVALS.find(interval => interval.id === chartInterval)?.label}</small></header>
      <strong className="quant-price">{data ? data.quote.price.toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN', { maximumFractionDigits: data.precision }) : '— —'}</strong>
      <span className={`quant-change ${data && data.quote.changePct < 0 ? 'negative' : ''}`}>{data ? `${data.quote.changePct >= 0 ? '+' : ''}${data.quote.changePct.toFixed(2)}% · ${data.quote.currency ?? ''}` : tr('等待行情', 'Awaiting market data')}</span>
      <svg className="quant-candles" viewBox="0 0 206 140" role="img" aria-label={data ? tr('价格 K 线快照', 'Candlestick price snapshot') : tr('K 线视觉模拟，非实时数据', 'Illustrative candles, not live data')}>
        {[26, 65, 104].map(value => <path key={value} d={`M0 ${value}H206`} className="quant-grid" />)}
        {candles.map((candle, index) => <g key={`${candle.time}-${index}`} className={candle.close >= candle.open ? 'quant-candle-up' : 'quant-candle-down'}><path d={`M${8 + index * 6.3} ${y(candle.high)}V${y(candle.low)}`} /><rect x={6.2 + index * 6.3} y={Math.min(y(candle.open), y(candle.close))} width="3.6" height={Math.max(1.5, Math.abs(y(candle.open) - y(candle.close)))} rx=".5" /></g>)}
        <path d={path} className="quant-average" />
        <path d="M0 127H206" className="quant-grid" />
        {candles.map((candle, index) => <rect key={index} x={6 + index * 6.3} y={139 - candle.volume / maxVolume * 11} width="4" height={candle.volume / maxVolume * 11} className="quant-volume" />)}
      </svg>
      <p className="quant-source" role="status">{data ? `${data.source === 'yahoo' ? 'Yahoo Finance' : 'Eastmoney'} · ${status === 'error' ? tr('更新失败，保留上次快照', 'Refresh failed · previous snapshot') : tr('行情快照', 'Market snapshot')}` : status === 'loading' ? tr('行情载入中 · 图形为模拟', 'Loading · illustrative chart') : tr('行情暂不可用 · 图形为模拟', 'Unavailable · illustrative chart')}</p>
      <button type="button" className="quant-refresh" disabled={status === 'loading'} onClick={() => setReload(value => value + 1)}><RefreshCw size={11} />{tr('刷新行情', 'Refresh snapshot')}</button>
    </section>
    <section className="quant-strategy">
      <header><span>STRATEGY / 01</span><span className="quant-orbit-mark">✧</span></header>
      <h3>{tr('让想法有迹可循。', 'Find the signal.')}<br /><span>{tr('从研究到验证。', 'Test the idea.')}</span></h3>
      <svg viewBox="0 0 206 125" aria-hidden="true">
        <defs><linearGradient id={gradient} x1="0" x2="1" y1="1" y2="0"><stop stopColor="#a3a5ff" /><stop offset="1" stopColor="#75dbed" /></linearGradient></defs>
        {Array.from({ length: 7 }, (_, row) => <path key={row} d={`M0 ${90 + row * 5} C40 ${110 + row * 2}, 70 ${20 + row * 8}, 110 ${68 + row * 4} S170 ${40 + row * 5}, 206 ${8 + row * 9}`} stroke={`url(#${gradient})`} fill="none" strokeWidth=".8" opacity={.25 + row * .1} />)}
        <path className="quant-signal" d="M0 110 C40 118,70 52,110 84 S170 60,206 44" stroke="#b7e8ff" fill="none" strokeWidth="2" />
        <circle cx="110" cy="84" r="3" fill="#d7eaff" />
      </svg>
      <span className="quant-simulation">{tr('策略视觉模拟 · 非收益预测', 'Visual simulation · not a forecast')}</span>
    </section>
    <button type="button" className="quant-open" onClick={onOpen}><span>{tr('打开交易所', 'Open Exchange')}<small>{tr('K 线 · 策略 · 复盘', 'Charts · strategies · journal')}</small></span><ArrowUpRight size={17} /></button>
    <p className="quant-footnote">{tr('把注意力留给好问题。', 'More room for better questions.')}</p>
  </aside>
}
