'use client'

import { useEffect, useRef, useState } from 'react'
import { findAsset } from '@/lib/market/universe'

export function fmtPrice(value: number | null | undefined, symbol?: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const dp = symbol ? findAsset(symbol)?.dp ?? 2 : value >= 1000 ? 0 : 2
  return value.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

export function fmtPct(value: number | null | undefined, digits = 2, fromFraction = false) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const v = fromFraction ? value * 100 : value
  return `${v > 0 ? '+' : ''}${v.toFixed(digits)}%`
}

export function fmtMoney(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

export function ago(iso: string | number | null | undefined, lang: 'zh' | 'en', now = Date.now()) {
  if (!iso) return '—'
  const s = Math.max(0, Math.round((now - (typeof iso === 'number' ? iso : Date.parse(iso))) / 1000))
  if (s < 60) return lang === 'en' ? `${s}s ago` : `${s} 秒前`
  if (s < 3600) return lang === 'en' ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 60)} 分钟前`
  if (s < 86400) return lang === 'en' ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 3600)} 小时前`
  return lang === 'en' ? `${Math.floor(s / 86400)}d ago` : `${Math.floor(s / 86400)} 天前`
}

/** 价格变化时闪一下绿/红，数字本身用等宽字体避免跳宽 */
export function FlashNumber({ value, flash, children, className = '' }: { value: number | null | undefined; flash?: { dir: 1 | -1; at: number }; children?: React.ReactNode; className?: string }) {
  const [tone, setTone] = useState<'' | 'up' | 'down'>('')
  const seen = useRef(flash?.at ?? 0)
  useEffect(() => {
    if (!flash || flash.at === seen.current) return
    seen.current = flash.at
    setTone(flash.dir > 0 ? 'up' : 'down')
    const id = setTimeout(() => setTone(''), 900)
    return () => clearTimeout(id)
  }, [flash])
  return <span className={`t-num ${tone ? `t-flash-${tone}` : ''} ${className}`} data-value={value ?? ''}>{children}</span>
}

/** 平滑过渡到新数值，用于净值、盈亏这类连续变化的数 */
export function useTween(target: number, ms = 600) {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = performance.now(), origin = from.current
    if (!Number.isFinite(target) || origin === target) { from.current = target; setValue(target); return }
    let frame = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - (1 - t) ** 3
      const v = origin + (target - origin) * eased
      from.current = v
      setValue(v)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, ms])
  return value
}

export function Sparkline({ values, width = 88, height = 26, tone, fill = true, className = '' }: { values: number[]; width?: number; height?: number; tone?: 'up' | 'down' | 'accent'; fill?: boolean; className?: string }) {
  if (values.length < 2) return <svg className={`t-spark ${className}`} width={width} height={height} aria-hidden="true" />
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - min) / span) * (height - 4)])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('')
  const color = tone ?? (values[values.length - 1] >= values[0] ? 'up' : 'down')
  return <svg className={`t-spark t-spark-${color} ${className}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    {fill && <path d={`${d}L${width},${height}L0,${height}Z`} className="t-spark-fill" />}
    <path d={d} className="t-spark-line" />
    <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="1.8" className="t-spark-dot" />
  </svg>
}

export function Panel({ code, title, right, children, className = '' }: { code: string; title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`t-panel ${className}`}>
    <header className="t-head"><span className="t-code">{code}</span><span className="t-title">{title}</span>{right && <span className="t-head-right">{right}</span>}</header>
    <div className="t-body">{children}</div>
  </section>
}

export function LiveDot({ status }: { status: 'idle' | 'live' | 'stale' | 'error' | 'open' | 'closed' }) {
  return <span className={`t-dot t-dot-${status}`} aria-hidden="true" />
}

export function Delta({ value, fromFraction = false, digits = 2 }: { value: number | null | undefined; fromFraction?: boolean; digits?: number }) {
  const v = value ?? 0
  return <span className={`t-num ${v > 0 ? 't-up' : v < 0 ? 't-down' : 't-flat'}`}>{fmtPct(value, digits, fromFraction)}</span>
}
