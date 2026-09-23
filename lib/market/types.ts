export type ChartInterval = "1" | "5" | "15" | "60" | "240" | "D"

export const INTERVALS: { id: ChartInterval; label: string }[] = [
  { id: "1", label: "1m" },
  { id: "5", label: "5m" },
  { id: "15", label: "15m" },
  { id: "60", label: "1H" },
  { id: "240", label: "4H" },
  { id: "D", label: "1D" },
]

export type Instrument = {
  symbol: string
  name: string
  nameEn: string
  market: string
  secid?: string
  yahoo?: string
  tv?: string
  timeZone?: string
  aliases?: string[]
}

export type Candle = {
  time: number | string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Quote = {
  price: number
  change: number
  changePct: number
  previous?: number
  high?: number
  low?: number
  volume?: number
  currency?: string
}

export type KlinePayload = {
  instrument: Instrument
  interval: ChartInterval
  source: "eastmoney" | "yahoo"
  candles: Candle[]
  quote: Quote
  precision: number
}

export type SearchResponse = {
  items: Instrument[]
}
