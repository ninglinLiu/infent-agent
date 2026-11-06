import { z } from 'zod'
import { UNIVERSE, findAsset } from './universe'

/**
 * Chainlink 链上喂价（Arbitrum One）。
 *
 * 一次 JSON-RPC batch 读取所有合约的 latestRoundData()，不需要任何 key。
 * 喂价按「偏离阈值或心跳」更新，所以它是校验锚，不是逐笔行情：
 * 沙箱撮合用实时报价成交，再和链上价格比对偏离度。
 */

export type OracleReading = {
  symbol: string
  pair: string
  price: number
  roundId: string
  updatedAt: string
  feed: string
  network: 'Arbitrum One'
  source: 'Chainlink Data Feeds'
}

const LATEST_ROUND_DATA = '0xfeaf968c'
const TTL_MS = 30_000
let snapshot: { at: number; readings: Map<string, OracleReading> } | null = null
let inflight: Promise<Map<string, OracleReading>> | null = null

const rpcResult = z.object({ id: z.number(), result: z.string().regex(/^0x[0-9a-fA-F]*$/).optional(), error: z.unknown().optional() })

/** latestRoundData 返回 5 个 32 字节字：roundId, answer, startedAt, updatedAt, answeredInRound */
export function decodeRound(hex: string, decimals: number) {
  const words = hex.slice(2).match(/.{64}/g)
  if (!words || words.length < 5) throw new Error('Malformed round data')
  let answer = BigInt('0x' + words[1])
  if (answer >= BigInt(2) ** BigInt(255)) answer -= BigInt(2) ** BigInt(256)
  if (answer <= BigInt(0)) throw new Error('Non-positive answer')
  const updated = Number(BigInt('0x' + words[3]))
  if (!updated) throw new Error('Round not complete')
  return { roundId: BigInt('0x' + words[0]).toString(), price: Number(answer) / 10 ** decimals, updatedAt: new Date(updated * 1000).toISOString() }
}

async function read(fetcher: typeof fetch = fetch): Promise<Map<string, OracleReading>> {
  const feeds = UNIVERSE.filter(asset => asset.chainlink)
  const url = process.env.ARB_RPC_URL || 'https://arbitrum-one-rpc.publicnode.com'
  const body = feeds.map((asset, id) => ({ jsonrpc: '2.0', id, method: 'eth_call', params: [{ to: asset.chainlink!.address, data: LATEST_ROUND_DATA }, 'latest'] }))
  const res = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(8_000), cache: 'no-store' })
  if (!res.ok) throw new Error('Oracle RPC unavailable')
  const rows = z.array(rpcResult).parse(await res.json())
  const readings = new Map<string, OracleReading>()
  for (const row of rows) {
    const asset = feeds[row.id]
    if (!asset || !row.result || row.error) continue
    try {
      const round = decodeRound(row.result, asset.chainlink!.decimals)
      readings.set(asset.symbol, { symbol: asset.symbol, pair: asset.chainlink!.pair, feed: asset.chainlink!.address, network: 'Arbitrum One', source: 'Chainlink Data Feeds', ...round })
    } catch { /* 单个喂价异常不影响其他品种 */ }
  }
  if (!readings.size) throw new Error('Oracle returned no readings')
  return readings
}

/** 全部链上喂价，实例内缓存 30 秒。 */
export async function loadOracle(fetcher?: typeof fetch): Promise<Map<string, OracleReading>> {
  if (snapshot && Date.now() - snapshot.at < TTL_MS) return snapshot.readings
  inflight ??= read(fetcher).then(readings => { snapshot = { at: Date.now(), readings }; return readings }).finally(() => { inflight = null })
  return inflight
}

export function oracleFor(readings: Map<string, OracleReading>, symbol: string) {
  const asset = findAsset(symbol)
  return asset ? readings.get(asset.symbol) : undefined
}
