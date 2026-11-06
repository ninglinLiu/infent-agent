import { z } from 'zod'
import { checkpointIndexes, REPLAY_CASES, type Series } from './replay'

const seriesSchema = z.object({
  symbol: z.string().min(1), source: z.string().min(1), snapshot: z.string().min(1),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(date => Number.isFinite(Date.parse(date)) && new Date(date).toISOString().startsWith(date))).min(2).max(10000),
  closes: z.array(z.number().finite().positive()).min(2).max(10000),
})

/** Validate network data before the player indexes prices or builds a chart. */
export function parseReplaySeries(raw: unknown, name: string): Series {
  const series = seriesSchema.parse(raw)
  const item = REPLAY_CASES.find(entry => entry.id === name)
  if (!item || series.symbol !== item.symbol || series.dates.length !== series.closes.length ||
    series.dates.some((date, i) => i > 0 && date <= series.dates[i - 1])) throw new Error('Invalid replay series')
  const points = checkpointIndexes(series, item.checkpoints)
  if (series.dates[0] > item.checkpoints[0].date ||
    points.some((point, i) => point <= (i ? points[i - 1] : 0) || point >= series.dates.length - 1)) {
    throw new Error('History does not cover the replay checkpoints')
  }
  return series
}
