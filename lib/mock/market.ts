// Deterministic mock market data so every visitor sees the same demo.
// Nothing here relies on Date.now() so the SSR static export is stable.

export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number }

// Tiny seeded PRNG (mulberry32) for reproducible series
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeCandles(opts: {
  seed?: number
  count?: number
  start?: number
  drift?: number
  vol?: number
}): Candle[] {
  const rnd = mulberry32(opts.seed ?? 7)
  const count = opts.count ?? 120
  const drift = opts.drift ?? 0.0012
  const vol = opts.vol ?? 0.018
  let price = opts.start ?? 182.4
  const out: Candle[] = []
  // Use index-based timestamps (ms) so SSR output is identical across renders.
  const BASE_T = 1_700_000_000_000
  const STEP_MS = 60 * 60 * 1000 // 1h
  for (let i = 0; i < count; i++) {
    const r1 = rnd() - 0.5
    const r2 = rnd() - 0.5
    const o = price
    const drift_i = drift * (1 + 0.3 * Math.sin(i / 9))
    const c = o * (1 + drift_i + r1 * vol)
    const h = Math.max(o, c) * (1 + Math.abs(r2) * vol * 0.6)
    const l = Math.min(o, c) * (1 - Math.abs(r2) * vol * 0.6)
    const v = 100_000 + rnd() * 1_400_000
    out.push({ t: BASE_T + i * STEP_MS, o, h, l, c, v })
    price = c
  }
  return out
}

// AI forecast band: an optimistic envelope around last price.
export function makeForecastBand(last: Candle, steps = 28, bias = 0.0015, seed = 42) {
  const rnd = mulberry32(seed)
  let mid = last.c
  const band: { t: number; mid: number; upper: number; lower: number }[] = []
  for (let i = 1; i <= steps; i++) {
    mid = mid * (1 + bias + (rnd() - 0.5) * 0.004)
    const spread = last.c * (0.008 + i * 0.0022)
    band.push({
      t: last.t + i * 60 * 60 * 1000,
      mid,
      upper: mid + spread,
      lower: mid - spread,
    })
  }
  return band
}

// Global tickers for the top ribbon
export const TOP_TICKERS = [
  { sym: "S&P 500",   px: 5612.34, chg: +0.82 },
  { sym: "NASDAQ",    px: 18214.76, chg: +1.14 },
  { sym: "DJI",       px: 40112.05, chg: +0.41 },
  { sym: "HSI",       px: 17842.90, chg: -0.37 },
  { sym: "CSI 300",   px: 3621.22, chg: +0.22 },
  { sym: "BTC",       px: 68921.10, chg: +2.64 },
  { sym: "ETH",       px: 3542.18, chg: +1.92 },
  { sym: "GOLD",      px: 2380.44, chg: +0.15 },
  { sym: "WTI",       px: 78.92,   chg: -0.83 },
  { sym: "USD/CNY",   px: 7.2481,  chg: +0.05 },
  { sym: "US10Y",     px: 4.214,   chg: -0.03 },
  { sym: "VIX",       px: 14.27,   chg: -2.11 },
]

// Sector heatmap (11 sectors × mock % change)
export type SectorCell = { name: string; nameEn: string; chg: number; weight: number }
export const SECTORS: SectorCell[] = [
  { name: "科技", nameEn: "Tech", chg: +2.14, weight: 28 },
  { name: "半导体", nameEn: "Semis", chg: +3.62, weight: 14 },
  { name: "AI 基础设施", nameEn: "AI Infra", chg: +4.08, weight: 9 },
  { name: "云软件", nameEn: "Cloud SaaS", chg: +1.81, weight: 11 },
  { name: "新能源", nameEn: "New energy", chg: -1.12, weight: 8 },
  { name: "消费", nameEn: "Consumer", chg: +0.42, weight: 10 },
  { name: "医药", nameEn: "Healthcare", chg: -0.68, weight: 7 },
  { name: "金融", nameEn: "Financials", chg: +0.21, weight: 6 },
  { name: "地产", nameEn: "Real estate", chg: -2.41, weight: 2 },
  { name: "能源", nameEn: "Energy", chg: -0.73, weight: 3 },
  { name: "黄金", nameEn: "Gold", chg: +0.35, weight: 2 },
]

// Initial portfolio holdings
export type Holding = {
  symbol: string
  name: string
  nameEn: string
  qty: number
  avg: number
  last: number
  weight: number // 0..1
  chg: number // today %
}
export const INITIAL_PORTFOLIO: Holding[] = [
  { symbol: "NVDA", name: "NVIDIA", nameEn: "NVIDIA", qty: 40,  avg: 104.2, last: 126.8, weight: 0.22, chg: +2.81 },
  { symbol: "AAPL", name: "Apple", nameEn: "Apple", qty: 60,  avg: 178.0, last: 189.4, weight: 0.18, chg: +0.94 },
  { symbol: "0700", name: "腾讯控股", nameEn: "Tencent", qty: 200, avg: 342.0, last: 378.2, weight: 0.16, chg: +1.22 },
  { symbol: "TSLA", name: "Tesla", nameEn: "Tesla", qty: 25,  avg: 240.1, last: 218.4, weight: 0.09, chg: -1.44 },
  { symbol: "SPY",  name: "SPY ETF", nameEn: "SPY ETF", qty: 80,  avg: 492.0, last: 518.3, weight: 0.14, chg: +0.82 },
  { symbol: "QQQ",  name: "QQQ ETF", nameEn: "QQQ ETF", qty: 30,  avg: 445.2, last: 478.1, weight: 0.08, chg: +1.14 },
  { symbol: "GLD",  name: "黄金 ETF", nameEn: "Gold ETF", qty: 150, avg: 198.0, last: 218.7, weight: 0.07, chg: +0.15 },
  { symbol: "CASH", name: "现金/货币", nameEn: "Cash / MMF", qty: 1,   avg: 1,     last: 1,     weight: 0.06, chg: 0 },
]

// News / sentiment feed
export type NewsItem = {
  id: string
  src: string
  time: string
  title: string
  titleEn: string
  sentiment: "up" | "down" | "neutral"
  tag?: string
  tagEn?: string
}
export const NEWS_FEED: NewsItem[] = [
  { id: "n1", src: "Reuters",   time: "09:42", title: "美联储官员称 9 月降息概率升至 74%", titleEn: "Fed speaker: Sept cut odds now 74%", sentiment: "up", tag: "宏观", tagEn: "Macro" },
  { id: "n2", src: "Bloomberg", time: "09:31", title: "NVIDIA 上调数据中心 GPU 出货指引，盘前涨 3.2%", titleEn: "NVDA raises datacenter GPU guide, +3.2% pre-market", sentiment: "up", tag: "AI", tagEn: "AI" },
  { id: "n3", src: "WSJ",       time: "09:18", title: "欧洲能源价格大幅回落，避险资产承压", titleEn: "EU energy prices fall; safe havens pressured", sentiment: "down", tag: "能源", tagEn: "Energy" },
  { id: "n4", src: "CNBC",      time: "09:05", title: "特斯拉 Q2 交付量不及预期，分析师下调目标价", titleEn: "TSLA Q2 deliveries miss; PTs cut", sentiment: "down", tag: "个股", tagEn: "Stock" },
  { id: "n5", src: "X · AI",    time: "08:57", title: "社交情绪：$NVDA 讨论热度 +182%，情绪指数 0.78", titleEn: "$NVDA social buzz +182%, mood 0.78", sentiment: "up", tag: "情绪", tagEn: "Sentiment" },
  { id: "n6", src: "新华社",     time: "08:42", title: "央行：保持流动性合理充裕，适时降准降息", titleEn: "PBOC: ample liquidity; cuts when appropriate", sentiment: "up", tag: "宏观", tagEn: "Macro" },
  { id: "n7", src: "财联社",     time: "08:30", title: "港股通南向资金连续第 9 日净买入", titleEn: "HK Connect: 9th day southbound net buy", sentiment: "up", tag: "资金", tagEn: "Flows" },
  { id: "n8", src: "Reuters",   time: "08:12", title: "OPEC+ 维持减产，WTI 短线下行", titleEn: "OPEC+ holds cuts; WTI dips", sentiment: "down", tag: "商品", tagEn: "Commodities" },
]
