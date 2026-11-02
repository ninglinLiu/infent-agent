import { z } from 'zod'
import { resolveInstrument } from '../market/presets'
import { TRADABLE, UNIVERSE, findAsset } from '../market/universe'
import { loadDaily } from '../market/history'
import { runBacktest } from '../quant/backtest'
import { analyzeDrivers, defaultDrivers } from '../quant/drivers'
import { BENCHMARKS, normalizeSpec, specId, strategySpec } from '../quant/strategy'

export const priceInput = z.object({ symbol: z.string().trim().min(1).max(24).regex(/^[A-Za-z0-9.^=-]+$/) }).strict()
export const onchainInput = z.object({ address: z.string().regex(/^0x[0-9a-fA-F]{40}$/) }).strict()
export const TOOL_DEFINITIONS = [
  { type: 'function', function: {
    name: 'get_price',
    description: 'Read an actual quote. Use BTC/ETH/SOL or Yahoo tickers such as AAPL, 600519.SS, 0700.HK. Include source, currency and quote time in your answer. Never guess a price if this fails.',
    parameters: { type: 'object', properties: { symbol: { type: 'string', description: 'Ticker, not a company name or URL' } }, required: ['symbol'], additionalProperties: false },
  } },
  { type: 'function', function: {
    name: 'get_onchain_stats',
    description: 'Read Ethereum mainnet native ETH balance and outgoing transaction nonce at one block. Does NOT return token holdings, trades, profit, win rate, or identity.',
    parameters: { type: 'object', properties: { address: { type: 'string', pattern: '^0x[0-9a-fA-F]{40}$' } }, required: ['address'], additionalProperties: false },
  } },
  { type: 'function', function: {
    name: 'analyze_drivers',
    description: 'Measure which assets lead or move with a target over the past year from real daily returns: lead-lag correlation at 0-5 trading days, adjusted for the broad market, Bonferroni-corrected. Use it for "what moves X" questions and before building a strategy around a single stock. It is correlation, not causation; say so.',
    parameters: { type: 'object', properties: {
      symbol: { type: 'string', enum: TRADABLE },
      drivers: { type: 'array', maxItems: 8, items: { type: 'string', enum: UNIVERSE.filter(a => a.cls !== 'crypto').map(a => a.symbol) }, description: 'Optional. Defaults to peers, sector ETF, US10Y, DXY, WTI, gold and VIX.' },
    }, required: ['symbol'], additionalProperties: false },
  } },
  { type: 'function', function: {
    name: 'draft_strategy',
    description: 'Turn the conversation into one executable portfolio strategy for the paper-trading sandbox. The server validates it and backtests it on about two years of real daily adjusted prices, returning the metrics. Weights are fractions (0.02-1) summing to at most 1; the remainder stays in cash. Capital is USD in the sandbox account, 1000-100000. stopLoss is a portfolio drawdown fraction 0.05-0.5, or 0 for none. Call again with revised arguments when the user asks for changes.',
    parameters: { type: 'object', properties: {
      title: { type: 'string', description: 'Short strategy name, <= 40 chars, in the user language' },
      thesis: { type: 'string', description: 'One or two sentences on why, <= 240 chars' },
      capital: { type: 'number' },
      legs: { type: 'array', minItems: 1, maxItems: 6, items: { type: 'object', properties: {
        symbol: { type: 'string', enum: TRADABLE }, weight: { type: 'number' }, role: { type: 'string', description: 'e.g. core, hedge, growth; <= 24 chars' },
      }, required: ['symbol', 'weight'], additionalProperties: false } },
      rebalance: { type: 'string', enum: ['none', 'monthly', 'quarterly'] },
      stopLoss: { type: 'number' },
      benchmark: { type: 'string', enum: BENCHMARKS },
      riskLevel: { type: 'integer', minimum: 1, maximum: 5 },
      horizon: { type: 'string', description: 'e.g. 12个月 / 12 months' },
    }, required: ['title', 'thesis', 'capital', 'legs', 'rebalance', 'stopLoss', 'benchmark', 'riskLevel', 'horizon'], additionalProperties: false },
  } },
] as const

export type ToolName = typeof TOOL_DEFINITIONS[number]['function']['name']
export type ToolResult =
  | { ok: true; source: string; observedAt: string; data: Record<string, unknown> }
  | { ok: false; code: 'INVALID_ARGUMENTS' | 'UNKNOWN_TOOL' | 'TIMEOUT' | 'UNAVAILABLE'; message: string }
export type ToolTrace = { id: string; name: string; arguments: Record<string, unknown>; result: ToolResult; durationMs: number }
export type ToolOptions = { fetcher?: typeof fetch; signal?: AbortSignal; timeoutMs?: number; rpcUrl?: string }

const numberValue = z.number().finite()
const quantity = z.string().regex(/^0x[0-9a-f]+$/i)

async function json(url: string, options: ToolOptions, init?: RequestInit): Promise<unknown> {
  const res = await (options.fetcher ?? fetch)(url, { ...init, signal: options.signal, cache: 'no-store' })
  if (!res.ok) throw new Error('Data provider unavailable')
  return res.json()
}

async function price(args: z.infer<typeof priceInput>, options: ToolOptions): Promise<ToolResult> {
  const symbol = args.symbol.toUpperCase()
  if (['BTC', 'ETH', 'SOL', 'BTC-USD', 'ETH-USD', 'SOL-USD'].includes(symbol)) {
    const base = symbol.replace('-USD', '')
    const response = z.object({ data: z.object({ amount: z.string(), base: z.literal(base), currency: z.literal('USD') }) })
      .parse(await json(`https://api.coinbase.com/v2/prices/${base}-USD/spot`, options))
    const amount = numberValue.positive().parse(Number(response.data.amount))
    return { ok: true, source: 'Coinbase spot', observedAt: new Date().toISOString(), data: {
      symbol: `${base}-USD`, price: amount, currency: 'USD', quotedAt: null,
      note: 'Spot snapshot. The provider does not supply a quote timestamp; observedAt is retrieval time.',
    } }
  }
  const ticker = findAsset(symbol)?.yahoo ?? resolveInstrument(symbol)?.yahoo ?? symbol
  const response = z.object({ chart: z.object({ result: z.array(z.object({ meta: z.object({
    symbol: z.string(), regularMarketPrice: numberValue.positive(), regularMarketTime: numberValue.positive(), currency: z.string().min(1),
  }) })).nonempty() }) }).parse(await json(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`, options,
    { headers: { 'User-Agent': 'Infent Research/1.0' } },
  ))
  const meta = response.chart.result[0].meta
  return { ok: true, source: 'Yahoo Finance', observedAt: new Date().toISOString(), data: {
    symbol: meta.symbol, price: meta.regularMarketPrice, currency: meta.currency,
    quotedAt: new Date(meta.regularMarketTime * 1000).toISOString(),
    note: 'Latest provider quote; may be delayed or from the last trading session.',
  } }
}

function weiToEth(value: bigint): string {
  const raw = value.toString().padStart(19, '0')
  const fraction = raw.slice(-18).replace(/0+$/, '')
  return `${raw.slice(0, -18)}${fraction ? '.' + fraction : ''}`
}

async function onchain(args: z.infer<typeof onchainInput>, options: ToolOptions): Promise<ToolResult> {
  // Only server configuration controls the endpoint; the model cannot choose a URL.
  const url = options.rpcUrl ?? process.env.ETH_RPC_URL ?? 'https://ethereum-rpc.publicnode.com'
  let nextId = 0
  const rpc = async (method: string, params: unknown[]) => {
    const id = ++nextId
    const body = z.object({ jsonrpc: z.literal('2.0'), id: z.literal(id), result: z.unknown(), error: z.unknown().optional() })
      .parse(await json(url, options, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) }))
    if (body.error || body.result === undefined || body.result === null) throw new Error('RPC error')
    return body.result
  }
  const chain = quantity.parse(await rpc('eth_chainId', []))
  if (BigInt(chain) !== BigInt(1)) throw new Error('RPC is not Ethereum mainnet')
  const block = z.object({ number: quantity, hash: z.string().regex(/^0x[0-9a-f]{64}$/i), timestamp: quantity })
    .parse(await rpc('eth_getBlockByNumber', ['latest', false]))
  // Hash pinning prevents a reorg from mixing state across the two requests.
  const atBlock = { blockHash: block.hash, requireCanonical: true }
  const [balance, nonce] = await Promise.all([
    rpc('eth_getBalance', [args.address, atBlock]), rpc('eth_getTransactionCount', [args.address, atBlock]),
  ])
  const wei = BigInt(quantity.parse(balance))
  return { ok: true, source: 'Ethereum JSON-RPC', observedAt: new Date().toISOString(), data: {
    address: args.address, chainId: 1, blockNumber: BigInt(block.number).toString(), blockHash: block.hash,
    blockTime: new Date(Number(BigInt(block.timestamp)) * 1000).toISOString(),
    balanceWei: wei.toString(), balanceEth: weiToEth(wei), outgoingTransactionCount: BigInt(quantity.parse(nonce)).toString(),
    note: 'Native ETH and outgoing nonce only. Not token holdings, total activity, trading performance or identity.',
  } }
}

export const driversInput = z.object({ symbol: z.string().trim().toUpperCase().max(12), drivers: z.array(z.string().trim().toUpperCase().max(12)).max(8).optional() }).strict()
/** MCP 客户端看到的入参形状；真正的校验由 strategySpec 完成，错误信息会告诉调用方怎么改。 */
export const draftInput = z.object({
  title: z.string(), thesis: z.string(), capital: z.number(),
  legs: z.array(z.object({ symbol: z.string(), weight: z.number(), role: z.string().optional() })).min(1).max(6),
  rebalance: z.enum(['none', 'monthly', 'quarterly']), stopLoss: z.number(),
  benchmark: z.enum(BENCHMARKS), riskLevel: z.number().int(), horizon: z.string(),
})

async function drivers(args: z.infer<typeof driversInput>): Promise<ToolResult> {
  const target = findAsset(args.symbol)
  if (!target || !target.tradable) return { ok: false, code: 'INVALID_ARGUMENTS', message: 'symbol must be one of the tradable whitelist symbols.' }
  const defaults = defaultDrivers(target.symbol)
  const wanted = (args.drivers?.length ? args.drivers : defaults.drivers).map(s => findAsset(s)?.symbol).filter((s): s is string => !!s && s !== target.symbol)
  const [main, market, ...rest] = await Promise.allSettled([target.symbol, defaults.market, ...wanted].map(s => loadDaily(s, '1y')))
  if (main.status !== 'fulfilled' || market.status !== 'fulfilled') throw new Error('History unavailable')
  const series = rest.flatMap(r => r.status === 'fulfilled' ? [r.value] : [])
  if (!series.length) throw new Error('No driver history')
  const report = analyzeDrivers(main.value, market.value, series, new Set(['US10Y']))
  return { ok: true, source: 'Yahoo Finance daily closes', observedAt: new Date().toISOString(), data: report }
}

async function draft(input: unknown): Promise<ToolResult> {
  const parsed = strategySpec.safeParse(normalizeSpec(input))
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 4).map(i => `${i.path.join('.') || 'strategy'}: ${i.message}`).join('; ')
    return { ok: false, code: 'INVALID_ARGUMENTS', message: `Fix and call draft_strategy again. ${issues}` }
  }
  const spec = parsed.data
  const symbols = [...new Set([...spec.legs.map(leg => leg.symbol), spec.benchmark])]
  const history = await Promise.all(symbols.map(s => loadDaily(s, '2y')))
  const get = (s: string) => history.find(h => h.symbol === s)!
  const backtest = runBacktest(spec, spec.legs.map(leg => get(leg.symbol)), get(spec.benchmark))
  // 现金比例直接给出，模型不必自己相加（实测会算错）
  const cashWeight = Math.round((1 - spec.legs.reduce((sum, leg) => sum + leg.weight, 0)) * 1000) / 1000
  return { ok: true, source: 'Yahoo Finance daily adjusted closes (backtest)', observedAt: new Date().toISOString(), data: { strategyId: specId(spec), spec, cashWeight, backtest } }
}

/** 回给模型的工具结果去掉画图用的大数组，界面仍从完整 trace 渲染。 */
export function toolResultForModel(name: string, result: ToolResult): ToolResult {
  if (!result.ok || name !== 'draft_strategy') return result
  const data = result.data as { backtest?: Record<string, unknown> }
  if (!data.backtest) return result
  const { curve: _curve, ...backtest } = data.backtest
  void _curve
  return { ...result, data: { ...result.data, backtest } }
}

function abortable<T>(job: Promise<T>, signal: AbortSignal) {
  return Promise.race([job, new Promise<never>((_, reject) => {
    if (signal.aborted) reject(new Error('aborted'))
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
  })])
}

export async function executeTool(name: string, input: unknown, options: ToolOptions = {}): Promise<ToolResult> {
  if (!['get_price', 'get_onchain_stats', 'analyze_drivers', 'draft_strategy'].includes(name)) return { ok: false, code: 'UNKNOWN_TOOL', message: 'Tool is not available.' }
  const heavy = name === 'analyze_drivers' || name === 'draft_strategy'
  const timeout = AbortSignal.timeout(options.timeoutMs ?? (heavy ? 20_000 : 8000))
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  if (name === 'draft_strategy') {
    try { return await abortable(draft(input), signal) }
    catch { return { ok: false, code: signal.aborted ? 'TIMEOUT' : 'UNAVAILABLE', message: 'Backtest data is unavailable right now. Do not invent performance numbers; tell the user the backtest could not run.' } }
  }
  if (name === 'analyze_drivers') {
    const checked = driversInput.safeParse(input)
    if (!checked.success) return { ok: false, code: 'INVALID_ARGUMENTS', message: 'Provide symbol from the tradable whitelist and optional drivers.' }
    try { return await abortable(drivers(checked.data), signal) }
    catch { return { ok: false, code: signal.aborted ? 'TIMEOUT' : 'UNAVAILABLE', message: 'Driver analysis data is unavailable. Do not substitute numbers.' } }
  }
  const parsed = (name === 'get_price' ? priceInput : onchainInput).safeParse(input)
  if (!parsed.success) return { ok: false, code: 'INVALID_ARGUMENTS', message: name === 'get_price' ? 'Provide a ticker (e.g. BTC, AAPL, 600519.SS), not a URL.' : 'Provide a 0x-prefixed 40-hex-character Ethereum address.' }
  try {
    return name === 'get_price'
      ? await price(priceInput.parse(parsed.data), { ...options, signal })
      : await onchain(onchainInput.parse(parsed.data), { ...options, signal })
  } catch {
    return { ok: false, code: signal.aborted ? 'TIMEOUT' : 'UNAVAILABLE', message: signal.aborted ? 'Data request timed out or was cancelled. No data is available.' : 'No verified data is available from the provider. Do not invent a replacement.' }
  }
}
