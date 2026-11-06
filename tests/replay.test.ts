import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { applyAction, checkpointIndexes, openPosition, REPLAY_CASES, replayResult, simulate, START_CAPITAL, verdict, type Series } from '../lib/academy/replay'
import { afterBuying, assetRisk, correlationIn, maxPosition, mixStats, recoveryNeeded, type LessonData } from '../lib/academy/lesson-math'
import { progressPatch } from '../lib/account/schemas'

const load = async <T,>(name: string) => JSON.parse(await readFile(`public/data/history/${name}.json`, 'utf8')) as T

test('every replay case has real data covering all checkpoints in order, both languages filled', async () => {
  for (const item of REPLAY_CASES) {
    const series = await load<Series>(item.id)
    assert.equal(series.symbol, item.symbol)
    assert.equal(series.dates.length, series.closes.length)
    assert.ok(series.closes.every(v => Number.isFinite(v) && v > 0), item.id)
    const points = checkpointIndexes(series, item.checkpoints)
    assert.equal(points.length, 4, item.id)
    assert.ok(points[0] > 0, 'the first decision comes after some history')
    points.forEach((p, i) => { if (i) assert.ok(p > points[i - 1], `${item.id} checkpoints ascend`) })
    assert.ok(points[3] < series.closes.length - 1, 'something is left to reveal after the last decision')
    item.checkpoints.forEach((cp, i) => {
      // 节点日期和真实交易日相差不超过一周（周线数据最多差几天）
      const gap = Math.abs(Date.parse(series.dates[points[i]]) - Date.parse(cp.date)) / 86400_000
      assert.ok(gap <= 7, `${item.id} ${cp.date} maps to ${series.dates[points[i]]}`)
      for (const text of [cp.event, cp.ask]) assert.ok(text.zh && text.en, cp.date)
    })
  }
})

test('history facts quoted in the copy match the data', async () => {
  const covid = await load<Series>('covid-2020')
  const peak = covid.dates.indexOf('2020-02-19'), low = covid.dates.indexOf('2020-03-23')
  assert.ok(Math.abs(covid.closes[low] / covid.closes[peak] - 1 + 0.337) < 0.005, 'SPY fell about 33.7% peak to trough')
  const gfc = await load<Series>('gfc-2008')
  const bottom = gfc.dates.indexOf('2009-03-09'), gm = gfc.dates.indexOf('2009-06-01')
  assert.ok(Math.abs(gfc.closes[gm] / gfc.closes[bottom] - 1.4) < 0.03, 'about 40% off the March low when GM filed')
  assert.equal(gfc.closes.indexOf(Math.min(...gfc.closes)), bottom)
})

test('replay actions move money without creating or losing any', () => {
  const start = openPosition(100)
  assert.equal(start.cash, START_CAPITAL * 0.4)
  assert.equal(start.shares * 100, START_CAPITAL * 0.6)
  for (const action of ['add', 'hold', 'trim', 'exit'] as const) {
    const after = applyAction(start, action, 80)
    assert.ok(Math.abs(after.cash + after.shares * 80 - (start.cash + start.shares * 80)) < 1e-6, action)
  }
  assert.equal(applyAction(start, 'exit', 80).shares, 0)
  assert.equal(applyAction(start, 'add', 80).cash, start.cash / 2)
})

test('simulation applies a decision at its checkpoint only, and exiting stops further moves', () => {
  const series = { closes: [100, 90, 50, 200] }
  const out = simulate(series, [1, 2], ['exit', 'hold'])
  assert.equal(out.values[0], START_CAPITAL)
  assert.equal(out.values[1], 40000 + 600 * 90)
  assert.equal(out.values[3], out.values[1], 'in cash after exit')
  const partial = simulate(series, [1, 2], ['exit'], 1)
  assert.equal(partial.values.length, 2)
  const result = replayResult(series, [1, 2], ['exit', 'hold'])
  assert.equal(result.hold, 40000 + 600 * 200)
  assert.equal(result.allIn, 200000)
  assert.ok(result.maxDrawdown > result.holdDrawdown, 'cash avoided the 50 low')
  assert.ok(verdict(result, ['exit', 'hold'], 'zh').length > 10)
  assert.match(verdict(replayResult(series, [1, 2], ['hold', 'hold']), ['hold', 'hold'], 'en'), /never traded/i)
})

test('lesson math on real prices', async () => {
  const data = await load<LessonData>('lessons')
  const { dates, series } = data
  assert.ok(Object.values(series).every(s => s.length === dates.length))
  assert.ok(Math.abs(recoveryNeeded(-0.5) - 1) < 1e-9, 'a 50% loss needs +100%')
  assert.equal(maxPosition(0.15, -0.5), 0.3)
  assert.equal(maxPosition(0.5, -0.2), 1, 'never above 100%')
  const after = afterBuying([100, 80, 90, 101, 70, 120], 0)
  assert.equal(after.worstAt, 4)
  assert.equal(after.recoveredAt, 5, 'recovery counts only after the deepest point')
  assert.equal(afterBuying([100, 110, 120], 0).worst, 0)
  const nvda = assetRisk(series.NVDA)
  assert.ok(nvda.maxDrawdown < -0.5 && nvda.totalReturn > 5, 'NVDA: deep drawdown, huge return')
  const qqq = mixStats(series.QQQ, series.QQQ, 1)
  const hedged = mixStats(series.QQQ, series.GLD, 0.6)
  assert.ok(hedged.maxDrawdown > qqq.maxDrawdown, 'gold reduced the real drawdown')
  assert.ok(correlationIn(dates, series.QQQ, series.TLT, '2022') > correlationIn(dates, series.QQQ, series.TLT, '2020'), 'stocks and bonds moved together more in 2022')
})

test('progress schema accepts replay records and rejects bad ones', () => {
  const record = { final: 112000, hold: 108000, decisions: ['add', 'hold', 'trim', 'exit'], at: '2026-11-02T12:00:00.000Z' }
  assert.equal(progressPatch.safeParse({ replays: { 'covid-2020': record } }).success, true)
  assert.equal(progressPatch.safeParse({ replays: { 'covid-2020': { ...record, decisions: ['yolo'] } } }).success, false)
  assert.equal(progressPatch.safeParse({ replays: { 'covid-2020': { ...record, user_id: 'B' } } }).success, false)
  assert.equal(progressPatch.safeParse({ replays: { 'bad key!': record } }).success, false)
  assert.ok(JSON.stringify({ replays: Object.fromEntries(REPLAY_CASES.map(c => [c.id, record])) }).length < 4096, 'fits save_learning_progress limit')
})
