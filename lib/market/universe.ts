/**
 * 行情白名单。实时报价、预言机校验、回测和模拟沙箱都只认这张表里的代码。
 *
 * 数据源取舍（2026-11 实测）：
 * - 实时报价：Yahoo Finance spark 批量接口，一次请求返回多个品种，免 key。
 * - 预言机：Chainlink 在 Arbitrum One 上的链上喂价合约，用公共 RPC 读 latestRoundData，免 key。
 *   Pyth Hermes 自 2026 年起需要 API key，因此不用。
 * - 加密货币只展示行情，不进入模拟交易。
 */

export type AssetClass = 'equity' | 'etf' | 'metal' | 'fx' | 'crypto' | 'index' | 'commodity'

export type Asset = {
  symbol: string
  name: string
  nameEn: string
  cls: AssetClass
  yahoo: string
  /** Chainlink 喂价合约（Arbitrum One proxy），没有则不做预言机校验 */
  chainlink?: { address: string; decimals: number; pair: string }
  tradable: boolean
  /** 交易时区，用于显示开收盘 */
  tz: string
  /** 价格小数位 */
  dp: number
}

const US = 'America/New_York'

export const UNIVERSE: Asset[] = [
  { symbol: 'SPY', name: '标普500 ETF', nameEn: 'S&P 500 ETF', cls: 'etf', yahoo: 'SPY', tradable: true, tz: US, dp: 2, chainlink: { address: '0x46306F3795342117721D8DEd50fbcF6DF2b3cc10', decimals: 8, pair: 'SPY / USD' } },
  { symbol: 'QQQ', name: '纳指100 ETF', nameEn: 'Nasdaq-100 ETF', cls: 'etf', yahoo: 'QQQ', tradable: true, tz: US, dp: 2 },
  { symbol: 'NVDA', name: '英伟达', nameEn: 'NVIDIA', cls: 'equity', yahoo: 'NVDA', tradable: true, tz: US, dp: 2, chainlink: { address: '0x4881A4418b5F2460B21d6F08CD5aA0678a7f262F', decimals: 8, pair: 'NVDA / USD' } },
  { symbol: 'AAPL', name: '苹果', nameEn: 'Apple', cls: 'equity', yahoo: 'AAPL', tradable: true, tz: US, dp: 2, chainlink: { address: '0x8d0CC5f38f9E802475f2CFf4F9fc7000C2E1557c', decimals: 8, pair: 'AAPL / USD' } },
  { symbol: 'MSFT', name: '微软', nameEn: 'Microsoft', cls: 'equity', yahoo: 'MSFT', tradable: true, tz: US, dp: 2, chainlink: { address: '0xDde33fb9F21739602806580bdd73BAd831DcA867', decimals: 8, pair: 'MSFT / USD' } },
  { symbol: 'TSLA', name: '特斯拉', nameEn: 'Tesla', cls: 'equity', yahoo: 'TSLA', tradable: true, tz: US, dp: 2, chainlink: { address: '0x3609baAa0a9b1f0FE4d6CC01884585d0e191C3E3', decimals: 8, pair: 'TSLA / USD' } },
  { symbol: 'AMZN', name: '亚马逊', nameEn: 'Amazon', cls: 'equity', yahoo: 'AMZN', tradable: true, tz: US, dp: 2, chainlink: { address: '0xd6a77691f071E98Df7217BED98f38ae6d2313EBA', decimals: 8, pair: 'AMZN / USD' } },
  { symbol: 'GOOGL', name: '谷歌', nameEn: 'Alphabet', cls: 'equity', yahoo: 'GOOGL', tradable: true, tz: US, dp: 2, chainlink: { address: '0x1D1a83331e9D255EB1Aaf75026B60dFD00A252ba', decimals: 8, pair: 'GOOGL / USD' } },
  { symbol: 'META', name: 'Meta', nameEn: 'Meta', cls: 'equity', yahoo: 'META', tradable: true, tz: US, dp: 2, chainlink: { address: '0xcd1bd86fDc33080DCF1b5715B6FCe04eC6F85845', decimals: 8, pair: 'META / USD' } },
  { symbol: 'TSM', name: '台积电', nameEn: 'TSMC ADR', cls: 'equity', yahoo: 'TSM', tradable: true, tz: US, dp: 2 },
  { symbol: 'AMD', name: 'AMD', nameEn: 'AMD', cls: 'equity', yahoo: 'AMD', tradable: true, tz: US, dp: 2 },
  { symbol: 'SOXX', name: '半导体 ETF', nameEn: 'Semiconductor ETF', cls: 'etf', yahoo: 'SOXX', tradable: true, tz: US, dp: 2 },
  { symbol: 'XLE', name: '能源 ETF', nameEn: 'Energy ETF', cls: 'etf', yahoo: 'XLE', tradable: true, tz: US, dp: 2 },
  { symbol: 'TLT', name: '20年+美债 ETF', nameEn: '20Y+ Treasury ETF', cls: 'etf', yahoo: 'TLT', tradable: true, tz: US, dp: 2 },
  { symbol: 'GLD', name: '黄金 ETF', nameEn: 'Gold ETF', cls: 'etf', yahoo: 'GLD', tradable: true, tz: US, dp: 2 },
  { symbol: 'XAU', name: '现货黄金', nameEn: 'Spot Gold', cls: 'metal', yahoo: 'GC=F', tradable: true, tz: US, dp: 1, chainlink: { address: '0x1F954Dc24a49708C26E0C1777f16750B5C6d5a2c', decimals: 8, pair: 'XAU / USD' } },
  { symbol: '2800.HK', name: '盈富基金', nameEn: 'Tracker Fund of HK', cls: 'etf', yahoo: '2800.HK', tradable: true, tz: 'Asia/Hong_Kong', dp: 2 },
  { symbol: '0700.HK', name: '腾讯控股', nameEn: 'Tencent', cls: 'equity', yahoo: '0700.HK', tradable: true, tz: 'Asia/Hong_Kong', dp: 1 },
  { symbol: '9988.HK', name: '阿里巴巴', nameEn: 'Alibaba', cls: 'equity', yahoo: '9988.HK', tradable: true, tz: 'Asia/Hong_Kong', dp: 2 },
  // 只看不交易
  { symbol: 'SPX', name: '标普500', nameEn: 'S&P 500', cls: 'index', yahoo: '^GSPC', tradable: false, tz: US, dp: 2 },
  { symbol: 'NDX', name: '纳斯达克100', nameEn: 'Nasdaq 100', cls: 'index', yahoo: '^NDX', tradable: false, tz: US, dp: 2 },
  { symbol: 'HSI', name: '恒生指数', nameEn: 'Hang Seng', cls: 'index', yahoo: '^HSI', tradable: false, tz: 'Asia/Hong_Kong', dp: 2 },
  { symbol: 'CSI300', name: '沪深300', nameEn: 'CSI 300', cls: 'index', yahoo: '000300.SS', tradable: false, tz: 'Asia/Shanghai', dp: 2 },
  { symbol: 'N225', name: '日经225', nameEn: 'Nikkei 225', cls: 'index', yahoo: '^N225', tradable: false, tz: 'Asia/Tokyo', dp: 2 },
  { symbol: 'US10Y', name: '美债10年收益率', nameEn: 'US 10Y Yield', cls: 'index', yahoo: '^TNX', tradable: false, tz: US, dp: 3 },
  { symbol: 'VIX', name: '恐慌指数', nameEn: 'VIX', cls: 'index', yahoo: '^VIX', tradable: false, tz: US, dp: 2 },
  { symbol: 'DXY', name: '美元指数', nameEn: 'US Dollar Index', cls: 'index', yahoo: 'DX-Y.NYB', tradable: false, tz: US, dp: 2 },
  { symbol: 'WTI', name: 'WTI 原油', nameEn: 'WTI Crude', cls: 'commodity', yahoo: 'CL=F', tradable: false, tz: US, dp: 2, chainlink: { address: '0x594b919AD828e693B935705c3F816221729E7AE8', decimals: 8, pair: 'WTI / USD' } },
  { symbol: 'XAG', name: '白银', nameEn: 'Silver', cls: 'metal', yahoo: 'SI=F', tradable: false, tz: US, dp: 2, chainlink: { address: '0xC56765f04B248394CF1619D20dB8082Edbfa75b1', decimals: 8, pair: 'XAG / USD' } },
  { symbol: 'USDCNH', name: '美元/离岸人民币', nameEn: 'USD/CNH', cls: 'fx', yahoo: 'CNH=X', tradable: false, tz: US, dp: 4 },
  { symbol: 'EURUSD', name: '欧元/美元', nameEn: 'EUR/USD', cls: 'fx', yahoo: 'EURUSD=X', tradable: false, tz: US, dp: 4, chainlink: { address: '0xA14d53bC1F1c0F31B4aA3BD109344E5009051a84', decimals: 8, pair: 'EUR / USD' } },
  { symbol: 'USDJPY', name: '美元/日元', nameEn: 'USD/JPY', cls: 'fx', yahoo: 'JPY=X', tradable: false, tz: US, dp: 3 },
  { symbol: 'BTC', name: '比特币', nameEn: 'Bitcoin', cls: 'crypto', yahoo: 'BTC-USD', tradable: false, tz: 'UTC', dp: 0, chainlink: { address: '0x6ce185860a4963106506C203335A2910413708e9', decimals: 8, pair: 'BTC / USD' } },
  { symbol: 'ETH', name: '以太坊', nameEn: 'Ether', cls: 'crypto', yahoo: 'ETH-USD', tradable: false, tz: 'UTC', dp: 1, chainlink: { address: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612', decimals: 8, pair: 'ETH / USD' } },
]

const BY_SYMBOL = new Map(UNIVERSE.map(asset => [asset.symbol, asset]))
const BY_ALIAS = new Map<string, Asset>()
for (const asset of UNIVERSE) {
  for (const alias of [asset.symbol, asset.yahoo, asset.symbol.replace('.HK', ''), asset.symbol.replace(/^0+/, '')]) BY_ALIAS.set(alias.toUpperCase(), asset)
}
BY_ALIAS.set('GOLD', BY_SYMBOL.get('XAU')!)
BY_ALIAS.set('700', BY_SYMBOL.get('0700.HK')!)
BY_ALIAS.set('TENCENT', BY_SYMBOL.get('0700.HK')!)

export function findAsset(input: string): Asset | undefined {
  return BY_ALIAS.get(input.trim().toUpperCase())
}

export const TRADABLE = UNIVERSE.filter(asset => asset.tradable).map(asset => asset.symbol)

/** 首页/交易所行情墙固定使用这一组，CDN 只缓存一个键。 */
export const BOARD = ['SPX', 'NDX', 'HSI', 'CSI300', 'N225', 'US10Y', 'VIX', 'DXY', 'XAU', 'WTI', 'USDCNH', 'EURUSD', 'BTC', 'ETH', 'SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'META', 'GOOGL', 'TSM', 'AMD', 'SOXX', 'TLT', 'GLD', '2800.HK', '0700.HK', '9988.HK']

export function assetName(asset: Asset, lang: 'zh' | 'en') {
  return lang === 'en' ? asset.nameEn : asset.name
}
