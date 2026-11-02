'use client'

import { useId } from 'react'
import type { BacktestResult } from '@/lib/quant/backtest'
import type { DriverReport } from '@/lib/quant/drivers'
import type { StrategySpec } from '@/lib/quant/strategy'
import { findAsset, assetName } from '@/lib/market/universe'
import { fmtMoney, fmtPct } from './primitives'

export const LEG_COLORS = ['#b48cff', '#4fd1b5', '#f3b664', '#7aa7ff', '#f07a9b', '#9be37a']

export type StrategyDraft = { strategyId: string; spec: StrategySpec; backtest: BacktestResult }

/** 驱动关系图：目标在中心，驱动绕一圈，显著的连线依次「长」出来。 */
export function DriverGraph({ report, lang, animate = true }: { report: DriverReport; lang: 'zh' | 'en'; animate?: boolean }) {
  const W = 440, H = 300, cx = W / 2, cy = H / 2 + 4
  const edges = report.edges.slice(0, 8)
  const R = 112
  const nodes = edges.map((edge, i) => {
    const angle = -Math.PI / 2 + (i / edges.length) * Math.PI * 2
    return { edge, x: cx + Math.cos(angle) * R * 1.45, y: cy + Math.sin(angle) * R }
  })
  return <svg className={`t-graph ${animate ? 't-animate' : ''}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={lang === 'en' ? `Drivers of ${report.target}` : `${report.target} 的驱动关系`}>
    <defs><radialGradient id="tg-glow"><stop offset="0" stopColor="#f3b664" stopOpacity=".45" /><stop offset="1" stopColor="#f3b664" stopOpacity="0" /></radialGradient></defs>
    <circle cx={cx} cy={cy} r={R * .62} className="t-graph-ring" />
    <circle cx={cx} cy={cy} r={R * 1.02} className="t-graph-ring faint" />
    {nodes.map(({ edge, x, y }, i) => {
      const cls = edge.kept ? (edge.partial >= 0 ? 'kept pos' : 'kept neg') : edge.confounded ? 'confounded' : 'weak'
      const mx = (x + cx) / 2, my = (y + cy) / 2
      return <g key={edge.driver} className={`t-edge ${cls}`} style={{ animationDelay: `${0.25 + i * 0.32}s` }}>
        <line x1={x} y1={y} x2={cx} y2={cy} pathLength={1} />
        {(edge.kept || edge.confounded) && <text x={mx} y={my - 4} textAnchor="middle" className="t-edge-label">{edge.confounded ? (lang === 'en' ? 'market' : '随大盘') : `lag ${edge.lag} · ρ ${edge.partial.toFixed(2)}`}</text>}
      </g>
    })}
    {nodes.map(({ edge, x, y }, i) => {
      const asset = findAsset(edge.driver)
      return <g key={`n-${edge.driver}`} className={`t-node ${edge.kept ? 'kept' : ''}`} style={{ animationDelay: `${0.1 + i * 0.32}s` }} transform={`translate(${x} ${y})`}>
        <rect x={-34} y={-15} width={68} height={30} rx={7} />
        <text y={-1} textAnchor="middle" className="t-node-sym">{edge.driver}</text>
        <text y={10} textAnchor="middle" className="t-node-sub">{asset ? assetName(asset, lang).slice(0, 8) : ''}</text>
      </g>
    })}
    <circle cx={cx} cy={cy} r={46} fill="url(#tg-glow)" className="t-target-glow" />
    <g className="t-node target" transform={`translate(${cx} ${cy})`}>
      <rect x={-40} y={-19} width={80} height={38} rx={9} />
      <text y={-2} textAnchor="middle" className="t-node-sym">{report.target}</text>
      <text y={11} textAnchor="middle" className="t-node-sub">{report.observations} {lang === 'en' ? 'days' : '个交易日'}</text>
    </g>
  </svg>
}

/** 回测净值曲线：策略 vs 基准，最大回撤区间用色带标出。 */
export function EquityCurve({ backtest, lang, height = 200, animate = true }: { backtest: BacktestResult; lang: 'zh' | 'en'; height?: number; animate?: boolean }) {
  const gid = useId().replace(/:/g, '')
  const W = 600, H = height, padL = 6, padR = 64, padT = 12, padB = 22
  const rows = backtest.curve
  const all = rows.flatMap(r => [r[1], r[2]])
  const min = Math.min(...all), max = Math.max(...all), span = max - min || 1
  const x = (i: number) => padL + (i / Math.max(1, rows.length - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - (v - min) / span) * (H - padT - padB)
  const path = (k: 1 | 2) => rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r[k]).toFixed(1)}`).join('')
  const ddFrom = rows.findIndex(r => r[0] >= backtest.drawdownFrom)
  const ddTo = rows.findIndex(r => r[0] >= backtest.drawdownTo)
  const last = rows[rows.length - 1]
  const grid = [0, .5, 1].map(f => min + span * f)
  return <svg className={`t-curve ${animate ? 't-animate' : ''}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={lang === 'en' ? 'Backtest equity curve' : '回测净值曲线'}>
    <defs><linearGradient id={`fill-${gid}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b48cff" stopOpacity=".32" /><stop offset="1" stopColor="#b48cff" stopOpacity="0" /></linearGradient></defs>
    {grid.map(v => <g key={v}><line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} className="t-curve-grid" /><text x={W - padR + 6} y={y(v) + 3} className="t-curve-axis">{fmtMoney(v)}</text></g>)}
    {ddFrom >= 0 && ddTo > ddFrom && <rect x={x(ddFrom)} width={Math.max(2, x(ddTo) - x(ddFrom))} y={padT} height={H - padT - padB} className="t-curve-dd" />}
    <path d={`${path(1)}L${x(rows.length - 1)},${H - padB}L${x(0)},${H - padB}Z`} fill={`url(#fill-${gid})`} className="t-curve-area" />
    <path d={path(2)} className="t-curve-bench" pathLength={1} />
    <path d={path(1)} className="t-curve-line" pathLength={1} />
    <circle cx={x(rows.length - 1)} cy={y(last[1])} r={3.5} className="t-curve-end" />
    <text x={padL} y={H - 6} className="t-curve-axis">{rows[0][0]}</text>
    <text x={W - padR} y={H - 6} textAnchor="end" className="t-curve-axis">{last[0]}</text>
  </svg>
}

export function AllocationBar({ spec, lang }: { spec: StrategySpec; lang: 'zh' | 'en' }) {
  const cash = Math.max(0, 1 - spec.legs.reduce((s, l) => s + l.weight, 0))
  return <div className="t-alloc">
    <div className="t-alloc-bar">{spec.legs.map((leg, i) => <i key={leg.symbol} style={{ width: `${leg.weight * 100}%`, background: LEG_COLORS[i % LEG_COLORS.length] }} title={`${leg.symbol} ${(leg.weight * 100).toFixed(0)}%`} />)}{cash > 0.001 && <i className="cash" style={{ width: `${cash * 100}%` }} />}</div>
    <div className="t-alloc-legend">{spec.legs.map((leg, i) => {
      const asset = findAsset(leg.symbol)
      return <span key={leg.symbol}><b style={{ background: LEG_COLORS[i % LEG_COLORS.length] }} />{leg.symbol}<small>{asset ? assetName(asset, lang) : ''}{leg.role ? ` · ${leg.role}` : ''}</small><em>{(leg.weight * 100).toFixed(0)}%</em></span>
    })}{cash > 0.001 && <span><b className="cash" />{lang === 'en' ? 'Cash' : '现金'}<em>{(cash * 100).toFixed(0)}%</em></span>}</div>
  </div>
}

export function MetricStrip({ backtest, lang }: { backtest: BacktestResult; lang: 'zh' | 'en' }) {
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const better = backtest.totalReturn >= backtest.benchmark.totalReturn
  const items: Array<[string, string, string?]> = [
    [tr('总收益', 'Total return'), fmtPct(backtest.totalReturn, 1, true), backtest.totalReturn >= 0 ? 't-up' : 't-down'],
    [tr('年化', 'CAGR'), fmtPct(backtest.cagr, 1, true)],
    [tr('最大回撤', 'Max drawdown'), fmtPct(backtest.maxDrawdown, 1, true), 't-down'],
    [tr('夏普', 'Sharpe'), backtest.sharpe.toFixed(2)],
    [tr('波动率', 'Volatility'), fmtPct(backtest.volatility, 1, true)],
    [`${tr('对比', 'vs')} ${backtest.benchmark.symbol}`, fmtPct(backtest.totalReturn - backtest.benchmark.totalReturn, 1, true), better ? 't-up' : 't-down'],
  ]
  return <div className="t-metrics">{items.map(([label, value, cls]) => <div key={label}><small>{label}</small><b className={`t-num ${cls ?? ''}`}>{value}</b></div>)}</div>
}
