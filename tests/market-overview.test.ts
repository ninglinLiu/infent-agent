import test from 'node:test'
import assert from 'node:assert/strict'
import { executeTool } from '../lib/ai/tools'
import { runAgent } from '../lib/ai/agent'
import type { LiveQuote } from '../lib/market/quotes'

const quote = (symbol: string, patch: Partial<LiveQuote> = {}): LiveQuote => ({
  symbol, price: 103, previousClose: 100, changePct: 3, currency: 'USD',
  quotedAt: '2026-11-05T21:00:00.000Z', open: false, spark: [101, 102, 103], source: 'Yahoo Finance', ...patch,
})

test('market overview batches global indices and macro with dates, units and honest partial coverage', async () => {
  let calls = 0
  const result = await executeTool('get_market_overview', {}, { quoteLoader: async symbols => {
    calls++
    assert.deepEqual(symbols, ['SPX', 'NDX', 'HSI', 'CSI300', 'N225', 'VIX', 'US10Y', 'DXY', 'XAU', 'WTI', 'USDCNH'])
    return new Map([
      ['SPX', quote('SPX')], ['US10Y', quote('US10Y', { price: 4.5 })],
      ['XAU', quote('XAU', { changePct: null, previousClose: null })],
    ])
  } })
  assert.equal(calls, 1)
  assert.ok(result.ok)
  const rows = result.data.quotes as Record<string, unknown>[]
  assert.equal(rows[0].quotedAt, '2026-11-05T21:00:00.000Z')
  assert.equal(rows[0].regularSessionOpen, false)
  assert.equal(rows[0].unit, 'index points')
  assert.equal(rows[1].unit, 'percent yield')
  assert.equal(rows[2].providerSymbol, 'GC=F')
  assert.match(String(rows[2].nameEn), /futures/)
  assert.equal(rows[2].changePct, null)
  assert.equal('spark' in rows[0], false)
  assert.ok((result.data.unavailableSymbols as string[]).includes('HSI'))
  assert.match(String(result.data.note), /not a synchronized global trading day/)
})

test('regional overview stays allowlisted and rejects arbitrary URLs before accessing data', async () => {
  const result = await executeTool('get_market_overview', { scope: 'hk' }, { quoteLoader: async symbols => {
    assert.deepEqual(symbols, ['HSI', '2800.HK', '0700.HK', '9988.HK', 'USDCNH', 'XAU'])
    return new Map([['HSI', quote('HSI')]])
  } })
  assert.ok(result.ok)
  for (const args of [null, { scope: 'https://evil.invalid' }, { url: 'http://localhost' }]) {
    const bad = await executeTool('get_market_overview', args, { quoteLoader: async () => { throw new Error('must not fetch') } })
    assert.equal(bad.ok, false)
    assert.equal(!bad.ok && bad.code, 'INVALID_ARGUMENTS')
  }
})

test('missing feed, provider errors and timeout produce no invented market numbers', async () => {
  for (const quoteLoader of [async () => new Map<string, LiveQuote>(), async (): Promise<Map<string, LiveQuote>> => { throw new Error('provider down') }]) {
    const result = await executeTool('get_market_overview', {}, { quoteLoader })
    assert.equal(result.ok, false)
    assert.equal(!result.ok && result.code, 'UNAVAILABLE')
  }
  const timedOut = await executeTool('get_market_overview', {}, {
    timeoutMs: 5, quoteLoader: () => new Promise(resolve => setTimeout(() => resolve(new Map()), 40)),
  })
  assert.equal(!timedOut.ok && timedOut.code, 'TIMEOUT')
})

test('today market question supports tool -> evidence -> answer streaming without a ticker follow-up', async () => {
  let rounds = 0, answer = ''
  const stream = (delta: unknown) => new Response(`data: ${JSON.stringify({ choices: [{ delta }] })}\n\ndata: [DONE]\n\n`)
  const result = await runAgent([{ role: 'user', content: '今天的市场行情概况' }], {
    config: { baseUrl: 'https://model.invalid/v1', apiKey: 'test-only', model: 'fixture' },
    signal: AbortSignal.timeout(5000), onText: text => { answer += text },
    toolOptions: { quoteLoader: async () => new Map([['SPX', quote('SPX')]]) },
    fetcher: async (_url, init) => {
      const request = JSON.parse(String(init?.body))
      rounds++
      if (rounds === 1) {
        assert.ok(request.tools.some((tool: { function: { name: string } }) => tool.function.name === 'get_market_overview'))
        return stream({ tool_calls: [{ index: 0, id: 'overview-1', type: 'function', function: { name: 'get_market_overview', arguments: '{}' } }] })
      }
      const evidence = JSON.parse(request.messages.at(-1).content)
      assert.equal(evidence.data.quotes[0].price, 103)
      assert.equal(evidence.data.quotes[0].changePct, 3)
      assert.ok(evidence.data.unavailableSymbols.includes('HSI'))
      return stream({ content: '测试回答：标普500最新可用报价103点，较前收盘上涨3%；报价来自Yahoo Finance，时间为2026-11-05 21:00 UTC，非今日实时成交。其他市场数据缺失。' })
    },
  })
  assert.equal(rounds, 2)
  assert.equal(result.traces[0].name, 'get_market_overview')
  assert.match(answer, /103点/)
})
