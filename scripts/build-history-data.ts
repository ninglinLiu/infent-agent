/**
 * 生成学习室用的静态历史行情（public/data/history/*.json）。
 *
 * 复盘和短课用的都是真实数据，但不在运行时请求上游：静态文件走 CDN，
 * 不消耗函数额度，演示时也不受行情源波动影响。需要更新时手动运行：
 *   node node_modules/tsx/dist/cli.mjs scripts/build-history-data.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fetchDirectJson } from '../lib/http'

type Chart = { chart?: { result?: Array<{ timestamp?: number[]; meta?: { exchangeTimezoneName?: string }; indicators?: { adjclose?: Array<{ adjclose?: Array<number | null> }> } }> } }

const OUT = join(process.cwd(), 'public', 'data', 'history')

async function daily(symbol: string, from: string, to: string, interval: '1d' | '1wk' = '1d') {
  const p1 = Date.parse(`${from}T00:00:00Z`) / 1000, p2 = Date.parse(`${to}T23:59:59Z`) / 1000
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${p1}&period2=${p2}&interval=${interval}&events=div%2Csplit`
  let json: Chart | null = null
  for (let i = 0; i < 4 && !json; i++) { try { json = await fetchDirectJson<Chart>(url, 12_000) } catch (e) { if (i === 3) throw e } }
  const result = json!.chart?.result?.[0]
  const tz = result?.meta?.exchangeTimezoneName || 'America/New_York'
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  const closes = result?.indicators?.adjclose?.[0]?.adjclose ?? []
  const rows = (result?.timestamp ?? []).flatMap((t, i) => typeof closes[i] === 'number' ? [[fmt.format(new Date(t * 1000)), +closes[i]!.toFixed(3)] as [string, number]] : [])
  if (rows.length < 30) throw new Error(`Too little data for ${symbol}`)
  return rows
}

function write(name: string, value: unknown) {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(value))
  console.log(name, JSON.stringify(value).length, 'bytes')
}

const SOURCE = { source: 'Yahoo Finance adjusted close (dividends and splits included)', snapshot: new Date().toISOString().slice(0, 10) }

;(async () => {
  mkdirSync(OUT, { recursive: true })
  const cases: Array<[string, string, string, string, '1d' | '1wk']> = [
    ['covid-2020', 'SPY', '2020-01-02', '2020-08-31', '1d'],
    ['hikes-2022', 'QQQ', '2021-11-01', '2023-06-30', '1d'],
    ['gfc-2008', 'SPY', '2008-08-01', '2009-12-31', '1d'],
    ['ko-1998', 'KO', '1998-01-02', '2003-12-31', '1wk'],
  ]
  for (const [id, symbol, from, to, interval] of cases) {
    const rows = await daily(symbol, from, to, interval)
    write(id, { ...SOURCE, symbol, interval, dates: rows.map(r => r[0]), closes: rows.map(r => r[1]) })
  }
  const symbols = ['SPY', 'QQQ', 'NVDA', 'GLD', 'TLT']
  const all = await Promise.all(symbols.map(s => daily(s, '2019-12-31', '2024-12-31')))
  const maps = all.map(rows => new Map(rows))
  const dates = all[0].map(r => r[0]).filter(d => maps.every(m => m.has(d)))
  write('lessons', { ...SOURCE, dates, series: Object.fromEntries(symbols.map((s, i) => [s, dates.map(d => maps[i].get(d)!)])) })
})().catch(e => { console.error(e); process.exit(1) })
