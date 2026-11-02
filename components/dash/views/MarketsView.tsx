"use client"

import { KLineChart } from "../KLineChart"
import { useDash } from "@/lib/dash-store"
import { useLang } from "@/lib/i18n"
import { useLiveMarket } from "@/lib/market/live"
import { assetName, findAsset } from "@/lib/market/universe"
import { MarketBoard, OraclePanel, TickerTape, WorldClocks } from "@/components/terminal/MarketBoard"
import { Delta, FlashNumber, fmtPrice, Panel, Sparkline } from "@/components/terminal/primitives"

/** 涨跌榜：从实时报价里现算，不再用写死的新闻和板块热力 */
function Movers({ onPick }: { onPick: (symbol: string) => void }) {
  const live = useLiveMarket()
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === "en" ? en : zh
  const rows = Object.values(live.quotes).filter(q => q.changePct !== null && findAsset(q.symbol)?.cls !== "index")
    .sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!)).slice(0, 9)
  return <Panel code="MOV" title={tr("异动榜 · 今日涨跌幅", "Movers · today")}>
    {!rows.length ? <p className="t-empty">{tr("等待行情…", "Waiting for quotes…")}</p> : <ul className="t-movers">{rows.map(q => {
      const asset = findAsset(q.symbol)
      return <li key={q.symbol}><button type="button" onClick={() => onPick(q.symbol)}>
        <span className="t-sym">{q.symbol}</span><small className="t-dim">{asset ? assetName(asset, lang) : ""}</small>
        <Sparkline values={q.spark} width={64} height={18} />
        <FlashNumber value={q.price} flash={live.flashes[q.symbol]}>{fmtPrice(q.price, q.symbol)}</FlashNumber>
        <Delta value={q.changePct} />
      </button></li>
    })}</ul>}
  </Panel>
}

export function MarketsView() {
  const { selectSymbol } = useDash()
  return (
    <div className="term t-exchange w-full min-w-0 h-full overflow-y-auto">
      <div className="t-topbar"><span className="t-brand">OMNI<b>·</b>EXCHANGE</span><WorldClocks /></div>
      <TickerTape />
      <div className="t-page">
        <div className="t-markets">
          <div className="t-chart-wrap"><KLineChart /></div>
          <div className="t-side-col"><Movers onPick={selectSymbol} /><OraclePanel limit={9} /></div>
        </div>
        <MarketBoard onPick={selectSymbol} />
      </div>
    </div>
  )
}
