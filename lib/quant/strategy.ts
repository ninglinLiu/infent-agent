import { z } from 'zod'
import { TRADABLE } from '@/lib/market/universe'

/**
 * 策略书：Agent 通过 draft_strategy 工具提交的结构化策略。
 * 服务端只接受这里校验通过的内容，回测、卡片和沙箱执行都从同一份 spec 出发，
 * 所以聊天里说的、卡片上显示的、沙箱里成交的始终是同一个东西。
 */

export const MAX_CAPITAL = 100_000
export const BENCHMARKS = ['SPY', 'QQQ', '2800.HK'] as const

const symbol = z.string().trim().toUpperCase().refine(value => TRADABLE.includes(value), 'Symbol is not in the tradable whitelist')

export const strategySpec = z.object({
  title: z.string().trim().min(2).max(40),
  thesis: z.string().trim().min(4).max(240),
  capital: z.number().finite().min(1_000).max(MAX_CAPITAL),
  legs: z.array(z.object({
    symbol,
    weight: z.number().finite().min(0.02).max(1),
    role: z.string().trim().max(24).optional(),
  }).strict()).min(1).max(6),
  rebalance: z.enum(['none', 'monthly', 'quarterly']),
  stopLoss: z.number().finite().min(0.05).max(0.5).nullable(),
  benchmark: z.enum(BENCHMARKS),
  riskLevel: z.number().int().min(1).max(5),
  horizon: z.string().trim().min(1).max(24),
}).strict().superRefine((spec, ctx) => {
  const total = spec.legs.reduce((sum, leg) => sum + leg.weight, 0)
  if (total > 1.0001) ctx.addIssue({ code: 'custom', message: `Weights sum to ${total.toFixed(3)}; must be <= 1 (the rest stays in cash)` })
  if (new Set(spec.legs.map(leg => leg.symbol)).size !== spec.legs.length) ctx.addIssue({ code: 'custom', message: 'Duplicate symbols' })
})
export type StrategySpec = z.infer<typeof strategySpec>

/** 模型给的参数宽松一些：容忍字符串数字、百分数、缺省字段，再交给严格 schema。 */
export function normalizeSpec(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input
  const raw = input as Record<string, unknown>
  const num = (value: unknown) => typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value.replace('%', ''))) ? Number(value.replace('%', '')) : value
  const fraction = (value: unknown) => { const n = num(value); return typeof n === 'number' && n > 1 ? n / 100 : n }
  const legs = Array.isArray(raw.legs) ? raw.legs.map(leg => leg && typeof leg === 'object' ? { ...leg as object, weight: fraction((leg as Record<string, unknown>).weight) } : leg) : raw.legs
  const stop = raw.stopLoss ?? raw.stop_loss
  return {
    title: raw.title, thesis: raw.thesis,
    capital: num(raw.capital ?? MAX_CAPITAL),
    legs,
    rebalance: raw.rebalance ?? 'quarterly',
    stopLoss: stop === undefined || stop === null || stop === 0 ? null : fraction(stop),
    benchmark: raw.benchmark ?? 'SPY',
    riskLevel: num(raw.riskLevel ?? raw.risk_level ?? 3),
    horizon: raw.horizon ?? '12M',
  }
}

/** 稳定的短 ID：同一份 spec 总是得到同一个 ID，用于卡片和执行记录对账。 */
export function specId(spec: StrategySpec): string {
  const text = JSON.stringify({ ...spec, legs: [...spec.legs].sort((a, b) => a.symbol.localeCompare(b.symbol)) })
  let h1 = 0x811c9dc5, h2 = 0x01000193
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0
    h2 = Math.imul(h2 + c, 2246822519) >>> 0
  }
  return `S-${h1.toString(36).toUpperCase().padStart(7, '0')}${(h2 % 1296).toString(36).toUpperCase().padStart(2, '0')}`
}
