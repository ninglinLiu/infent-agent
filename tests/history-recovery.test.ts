import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseReplaySeries } from '../lib/academy/history-validation'
import { REPLAY_CASES } from '../lib/academy/replay'
import { readAcademy } from '../lib/academy'

test('all published replay files pass network validation', () => {
  for (const item of REPLAY_CASES) {
    const raw = JSON.parse(readFileSync(`public/data/history/${item.id}.json`, 'utf8'))
    assert.equal(parseReplaySeries(raw, item.id).symbol, item.symbol)
  }
})

test('reject malformed or incomplete history before chart rendering', () => {
  const raw = JSON.parse(readFileSync('public/data/history/covid-2020.json', 'utf8'))
  for (const invalid of [
    null, {}, { ...raw, dates: [], closes: [] }, { ...raw, closes: raw.closes.slice(1) },
    { ...raw, closes: raw.closes.map(() => 0) }, { ...raw, dates: raw.dates.map(() => '2020-02-30') },
    { ...raw, dates: [...raw.dates].reverse() }, { ...raw, symbol: 'QQQ' },
    { ...raw, dates: raw.dates.slice(0, 20), closes: raw.closes.slice(0, 20) },
  ]) assert.throws(() => parseReplaySeries(invalid, 'covid-2020'))
})

test('reload preserves valid replay results and other progress, discards corrupt results', () => {
  const replay = { final: 102000, hold: 101000, decisions: ['hold', 'trim', 'add', 'hold'], at: '2026-11-06T00:00:00.000Z' }
  const state = readAcademy(JSON.stringify({ name: 'Alice', storyStep: 1, lessonStep: 4, simulationStep: 2,
    replays: { 'covid-2020': replay, 'gfc-2008': { ...replay, final: 'bad' }, 'bad/key': replay } }))
  assert.equal(state.storyStep, 1)
  assert.equal(state.lessonStep, 4)
  assert.equal(state.simulationStep, 2)
  assert.deepEqual(state.replays, { 'covid-2020': replay })
})
