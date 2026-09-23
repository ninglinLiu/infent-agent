import type { Candle, ChartInterval } from "./types"

export const VIEW_BARS = 100
export const FORECAST_STEPS = 18

const STEP_SEC: Record<ChartInterval, number> = {
  "1": 60,
  "5": 300,
  "15": 900,
  "60": 3600,
  "240": 14400,
  D: 86400,
}

export function stepTime(time: number | string, interval: ChartInterval): number | string {
  if (typeof time === "number") return time + STEP_SEC[interval]
  const [y, m, d] = time.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  do {
    date.setUTCDate(date.getUTCDate() + 1)
  } while (interval === "D" && (date.getUTCDay() === 0 || date.getUTCDay() === 6))
  return date.toISOString().slice(0, 10)
}

export function visibleFrom(barCount: number, extraRight = FORECAST_STEPS + 2) {
  const window = Math.min(VIEW_BARS, Math.max(24, barCount))
  return {
    from: Math.max(-1, barCount - window),
    to: barCount + extraRight - 1,
  }
}

export function markIndex(idxRatio: number, viewLen: number, offset = 0) {
  const inside = Math.round(Math.min(1, Math.max(0, idxRatio)) * Math.max(0, viewLen - 1))
  return offset + inside
}

export type ForecastPoint = {
  time: number | string
  mid: number
  upper: number
  lower: number
}

export function buildForecast(last: Candle, interval: ChartInterval, steps = FORECAST_STEPS): ForecastPoint[] {
  let t = last.time
  let mid = last.close
  const out: ForecastPoint[] = []
  for (let i = 1; i <= steps; i++) {
    t = stepTime(t, interval)
    mid = mid * (1 + 0.0015 + Math.sin(i / 3.2) * 0.0011)
    const spread = last.close * (0.006 + i * 0.0016)
    out.push({ time: t, mid, upper: mid + spread, lower: mid - spread })
  }
  return out
}
