'use client'

import { useId } from 'react'

export type ChartMarker = { index: number; label?: string; tone?: 'add' | 'hold' | 'trim' | 'exit' | 'buy' | 'low' }

/**
 * 学习室用的轻量折线图。reveal 之后的数据不画，Y 轴也只按已揭示的部分缩放，
 * 这样复盘时不会从坐标轴上泄露后面的高低点。
 */
export function HistoryChart({ dates, values, reveal, overlay, markers = [], band, height = 300, format = v => v.toFixed(2), ariaLabel }: {
  dates: string[]
  values: number[]
  reveal?: number
  overlay?: number[]
  markers?: ChartMarker[]
  band?: [number, number]
  height?: number
  format?: (value: number) => string
  ariaLabel: string
}) {
  const gid = useId().replace(/:/g, '')
  const W = 760, H = height, L = 6, R = 62, T = 14, B = 24
  const last = Math.min(reveal ?? values.length - 1, values.length - 1)
  const shown = values.slice(0, last + 1)
  const extra = overlay ? overlay.slice(0, last + 1) : []
  const all = [...shown, ...extra]
  const lo = Math.min(...all), hi = Math.max(...all)
  const pad = (hi - lo || hi || 1) * 0.08
  const min = lo - pad, max = hi + pad
  const x = (i: number) => L + (i / Math.max(1, values.length - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - (v - min) / (max - min)) * (H - T - B)
  const path = (data: number[]) => data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const ticks = [min + pad, (min + max) / 2, max - pad]
  return <svg className="study-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
    <defs>
      <linearGradient id={`area-${gid}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8055c6" stopOpacity=".24" /><stop offset="1" stopColor="#8055c6" stopOpacity="0" /></linearGradient>
      <pattern id={`future-${gid}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#8055c6" strokeOpacity=".08" strokeWidth="2" /></pattern>
    </defs>
    {ticks.map(v => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="study-chart-grid" /><text x={W - R + 6} y={y(v) + 3} className="study-chart-axis">{format(v)}</text></g>)}
    {last < values.length - 1 && <rect x={x(last)} y={T} width={W - R - x(last)} height={H - T - B} fill={`url(#future-${gid})`} />}
    {band && band[1] <= last && <rect x={x(band[0])} y={T} width={Math.max(2, x(band[1]) - x(band[0]))} height={H - T - B} className="study-chart-band" />}
    <path d={`${path(shown)}L${x(last)},${H - B}L${x(0)},${H - B}Z`} fill={`url(#area-${gid})`} />
    {overlay && <path d={path(extra)} className="study-chart-overlay" />}
    <path d={path(shown)} className="study-chart-line" />
    {markers.filter(m => m.index <= last).map(m => <g key={`${m.index}-${m.label ?? ''}`} className={`study-chart-mark ${m.tone ?? ''}`}>
      <line x1={x(m.index)} x2={x(m.index)} y1={T} y2={H - B} />
      <circle cx={x(m.index)} cy={y(values[m.index])} r={4.5} />
      {m.label && <text x={Math.min(x(m.index) + 7, W - R - 44)} y={T + 11}>{m.label}</text>}
    </g>)}
    <circle cx={x(last)} cy={y(values[last])} r={4} className="study-chart-now" />
    <text x={L} y={H - 7} className="study-chart-axis">{dates[0]}</text>
    {last < values.length - 1 && <text x={Math.min(x(last), W - R - 60)} y={H - 7} textAnchor="middle" className="study-chart-axis strong">{dates[last]}</text>}
    <text x={W - R} y={H - 7} textAnchor="end" className="study-chart-axis">{last < values.length - 1 ? '?' : dates[values.length - 1]}</text>
  </svg>
}
