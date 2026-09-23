import type { Instrument } from "./types"

export const PRESET_LIST: Instrument[] = [
  {
    symbol: "NVDA",
    name: "英伟达",
    nameEn: "NVIDIA Corp",
    market: "NASDAQ",
    secid: "105.NVDA",
    yahoo: "NVDA",
    tv: "NASDAQ:NVDA",
    timeZone: "America/New_York",
  },
  {
    symbol: "AAPL",
    name: "苹果",
    nameEn: "Apple",
    market: "NASDAQ",
    secid: "105.AAPL",
    yahoo: "AAPL",
    tv: "NASDAQ:AAPL",
    timeZone: "America/New_York",
  },
  {
    symbol: "TSLA",
    name: "特斯拉",
    nameEn: "Tesla",
    market: "NASDAQ",
    secid: "105.TSLA",
    yahoo: "TSLA",
    tv: "NASDAQ:TSLA",
    timeZone: "America/New_York",
  },
  {
    symbol: "MSFT",
    name: "微软",
    nameEn: "Microsoft",
    market: "NASDAQ",
    secid: "105.MSFT",
    yahoo: "MSFT",
    tv: "NASDAQ:MSFT",
    timeZone: "America/New_York",
  },
  {
    symbol: "0700",
    name: "腾讯控股",
    nameEn: "Tencent",
    market: "HKEX",
    secid: "116.00700",
    yahoo: "0700.HK",
    tv: "HKEX:700",
    timeZone: "Asia/Hong_Kong",
    aliases: ["700", "00700", "0700.HK"],
  },
  {
    symbol: "600519",
    name: "贵州茅台",
    nameEn: "Kweichow Moutai",
    market: "SSE",
    secid: "1.600519",
    yahoo: "600519.SS",
    tv: "SSE:600519",
    timeZone: "Asia/Shanghai",
    aliases: ["600519.SS"],
  },
  {
    symbol: "SPY",
    name: "标普500 ETF",
    nameEn: "SPDR S&P 500",
    market: "AMEX",
    secid: "107.SPY",
    yahoo: "SPY",
    tv: "AMEX:SPY",
    timeZone: "America/New_York",
  },
  {
    symbol: "QQQ",
    name: "纳指100 ETF",
    nameEn: "Invesco QQQ",
    market: "NASDAQ",
    secid: "105.QQQ",
    yahoo: "QQQ",
    tv: "NASDAQ:QQQ",
    timeZone: "America/New_York",
  },
  {
    symbol: "GLD",
    name: "黄金 ETF",
    nameEn: "SPDR Gold",
    market: "AMEX",
    secid: "107.GLD",
    yahoo: "GLD",
    tv: "AMEX:GLD",
    timeZone: "America/New_York",
  },
  {
    symbol: "BTC-USD",
    name: "比特币",
    nameEn: "Bitcoin",
    market: "CRYPTO",
    yahoo: "BTC-USD",
    tv: "BINANCE:BTCUSDT",
    timeZone: "UTC",
    aliases: ["BTC", "XBT"],
  },
  {
    symbol: "ETH-USD",
    name: "以太坊",
    nameEn: "Ethereum",
    market: "CRYPTO",
    yahoo: "ETH-USD",
    tv: "BINANCE:ETHUSDT",
    timeZone: "UTC",
    aliases: ["ETH"],
  },
  {
    symbol: "^GSPC",
    name: "标普500",
    nameEn: "S&P 500",
    market: "INDEX",
    yahoo: "^GSPC",
    tv: "SP:SPX",
    timeZone: "America/New_York",
    aliases: ["S&P 500", "SPX", "SP500"],
  },
  {
    symbol: "^IXIC",
    name: "纳斯达克综指",
    nameEn: "NASDAQ Composite",
    market: "INDEX",
    yahoo: "^IXIC",
    tv: "NASDAQ:IXIC",
    timeZone: "America/New_York",
    aliases: ["NASDAQ", "IXIC"],
  },
  {
    symbol: "^DJI",
    name: "道琼斯",
    nameEn: "Dow Jones",
    market: "INDEX",
    yahoo: "^DJI",
    tv: "DJ:DJI",
    timeZone: "America/New_York",
    aliases: ["DJI", "DJIA"],
  },
  {
    symbol: "^HSI",
    name: "恒生指数",
    nameEn: "Hang Seng",
    market: "INDEX",
    yahoo: "^HSI",
    tv: "HSI:HSI",
    timeZone: "Asia/Hong_Kong",
    aliases: ["HSI"],
  },
  {
    symbol: "000300",
    name: "沪深300",
    nameEn: "CSI 300",
    market: "SSE",
    secid: "1.000300",
    yahoo: "000300.SS",
    tv: "SSE:000300",
    timeZone: "Asia/Shanghai",
    aliases: ["CSI 300", "CSI300"],
  },
  {
    symbol: "GC=F",
    name: "黄金期货",
    nameEn: "Gold Futures",
    market: "COMEX",
    yahoo: "GC=F",
    tv: "COMEX:GC1!",
    timeZone: "America/New_York",
    aliases: ["GOLD", "XAU"],
  },
  {
    symbol: "CL=F",
    name: "WTI 原油",
    nameEn: "WTI Crude",
    market: "NYMEX",
    yahoo: "CL=F",
    tv: "NYMEX:CL1!",
    timeZone: "America/New_York",
    aliases: ["WTI", "OIL"],
  },
  {
    symbol: "CNY=X",
    name: "美元兑人民币",
    nameEn: "USD/CNY",
    market: "FX",
    yahoo: "CNY=X",
    tv: "FX:USDCNY",
    timeZone: "America/New_York",
    aliases: ["USD/CNY", "USDCNY"],
  },
  {
    symbol: "^TNX",
    name: "美债10年",
    nameEn: "US 10Y Yield",
    market: "INDEX",
    yahoo: "^TNX",
    tv: "TVC:US10Y",
    timeZone: "America/New_York",
    aliases: ["US10Y"],
  },
  {
    symbol: "^VIX",
    name: "恐慌指数",
    nameEn: "CBOE VIX",
    market: "INDEX",
    yahoo: "^VIX",
    tv: "CBOE:VIX",
    timeZone: "America/New_York",
    aliases: ["VIX"],
  },
]

const INDEX: Record<string, Instrument> = {}
for (const inst of PRESET_LIST) {
  INDEX[inst.symbol.toUpperCase()] = inst
  for (const alias of inst.aliases ?? []) {
    INDEX[alias.toUpperCase()] = inst
  }
}

export const DEFAULT_INSTRUMENT = PRESET_LIST[0]

export function resolveInstrument(input: string): Instrument | undefined {
  const key = input.trim().toUpperCase()
  if (!key) return undefined
  return INDEX[key]
}

export function filterPresets(query: string, limit = 8): Instrument[] {
  const q = query.trim().toUpperCase()
  if (!q) return PRESET_LIST.slice(0, limit)
  return PRESET_LIST.filter((inst) => {
    const hay = [inst.symbol, inst.name, inst.nameEn, inst.market, ...(inst.aliases ?? [])]
      .join(" ")
      .toUpperCase()
    return hay.includes(q)
  }).slice(0, limit)
}

export function tradingViewUrl(inst: Instrument): string {
  const symbol = inst.tv ?? inst.yahoo ?? inst.symbol
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`
}

export function displayName(inst: Instrument, lang: "zh" | "en"): string {
  return lang === "en" ? inst.nameEn : inst.name
}
