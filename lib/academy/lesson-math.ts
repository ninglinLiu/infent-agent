import { correlation, maxDrawdown } from '@/lib/quant/stats'

export type LessonData = { dates: string[]; series: Record<string, number[]>; source: string; snapshot: string }

/** 从 start 买入之后，最多浮亏多少、何时最深、多久回本。 */
export function afterBuying(closes: number[], start: number) {
  const entry = closes[start]
  let worst = 0, worstAt = start, recoveredAt: number | null = null
  for (let i = start; i < closes.length; i++) {
    const change = closes[i] / entry - 1
    if (change < worst) { worst = change; worstAt = i; recoveredAt = null }
    if (worst < 0 && recoveredAt === null && i > worstAt && closes[i] >= entry) recoveredAt = i
  }
  return { worst, worstAt, recoveredAt }
}

/** 亏掉 loss（负数）之后，需要涨多少才能回本。 */
export function recoveryNeeded(loss: number) {
  return 1 / (1 + loss) - 1
}

export function assetRisk(closes: number[]) {
  const dd = maxDrawdown(closes)
  return { maxDrawdown: dd.value, from: dd.from, to: dd.to, totalReturn: closes[closes.length - 1] / closes[0] - 1 }
}

/** 能承受账户亏 budget（正数）时，按历史最大回撤算出的仓位上限。 */
export function maxPosition(budget: number, drawdown: number) {
  return Math.min(1, budget / Math.abs(drawdown))
}

export function returnsOf(closes: number[]) {
  return closes.slice(1).map((value, i) => value / closes[i] - 1)
}

/** 两资产组合按日再平衡的净值曲线，起点 100。 */
export function mixCurve(a: number[], b: number[], weightA: number) {
  const ra = returnsOf(a), rb = returnsOf(b)
  const curve = [100]
  ra.forEach((r, i) => curve.push(curve[i] * (1 + weightA * r + (1 - weightA) * rb[i])))
  return curve
}

export function mixStats(a: number[], b: number[], weightA: number) {
  const curve = mixCurve(a, b, weightA)
  return { curve, totalReturn: curve[curve.length - 1] / 100 - 1, maxDrawdown: maxDrawdown(curve).value }
}

export function yearSlice(dates: string[], year: string) {
  const from = dates.findIndex(d => d.startsWith(year))
  let to = from
  while (to + 1 < dates.length && dates[to + 1].startsWith(year)) to++
  return [from, to + 1] as const
}

export function correlationIn(dates: string[], a: number[], b: number[], year?: string) {
  const [from, to] = year ? yearSlice(dates, year) : [0, dates.length]
  return correlation(returnsOf(a.slice(from, to)), returnsOf(b.slice(from, to)))
}
