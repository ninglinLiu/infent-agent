"use client"

import { useState } from "react"
import { RotateCcw, X } from "lucide-react"
import { useAccount } from "@/components/account/AccountProvider"
import { RequireAccount } from "@/components/account/AccountAccess"
import { useLang } from "@/lib/i18n"
import { useLiveMarket } from "@/lib/market/live"
import { assetName, findAsset } from "@/lib/market/universe"
import { resetSandbox, useSandbox } from "@/lib/sandbox/client"
import { STARTING_CASH } from "@/lib/sandbox/engine"
import { ExecutionTheater, type TheaterRequest } from "@/components/terminal/ExecutionTheater"
import { LEG_COLORS } from "@/components/terminal/StrategyViz"
import { ago, FlashNumber, fmtMoney, fmtPct, fmtPrice, LiveDot, Panel, useTween } from "@/components/terminal/primitives"

function Portfolio() {
  const { user } = useAccount()
  const { portfolio, loading, error } = useSandbox(user?.id)
  const live = useLiveMarket()
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === "en" ? en : zh
  const [theater, setTheater] = useState<TheaterRequest | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const positions = (portfolio?.positions ?? []).map(p => {
    const quote = live.quotes[p.symbol]
    const last = quote?.price ?? p.cost
    return { ...p, quote, last, value: p.qty * last, pnl: (last - p.cost) * p.qty, pnlPct: p.cost ? last / p.cost - 1 : 0 }
  })
  const invested = positions.reduce((s, p) => s + p.value, 0)
  const cash = portfolio?.cash ?? STARTING_CASH
  const nav = cash + invested
  const shownNav = useTween(nav)
  const fees = (portfolio?.orders ?? []).reduce((s, o) => s + o.fee, 0)

  if (!portfolio && loading) return <p className="t-empty">{tr("正在读取模拟账户…", "Loading paper account…")}</p>
  if (!portfolio && error) return <p className="t-error">{error}</p>

  return <div className="t-page">
    <div className="t-summary">
      <div className="t-summary-main"><small>{tr("组合净值", "Net asset value")}</small><b className="t-num">{fmtMoney(shownNav, 2)}</b><span className={`t-num ${nav >= STARTING_CASH ? "t-up" : "t-down"}`}>{fmtMoney(nav - STARTING_CASH, 2)} · {fmtPct(nav / STARTING_CASH - 1, 2, true)}</span></div>
      <div><small>{tr("累计费用", "Fees paid")}</small><b className="t-num">{fmtMoney(fees, 2)}</b></div>
      <div><small>{tr("现金", "Cash")}</small><b className="t-num">{fmtMoney(cash, 2)}</b></div>
      <div><small>{tr("持仓市值", "Invested")}</small><b className="t-num">{fmtMoney(invested, 2)}</b></div>
      <div><small>{tr("账本", "Ledger")}</small><b className="t-badge">{portfolio?.mode === "db" ? "Supabase" : tr("本地", "Local")}<LiveDot status={live.status} /></b></div>
      <div className="t-summary-actions">{confirmReset
        ? <><span className="t-dim">{tr("重置为 $100,000？历史记录会保留。", "Reset to $100,000? History is kept.")}</span><button type="button" className="t-btn" onClick={() => { setConfirmReset(false); void resetSandbox() }}>{tr("确认", "Confirm")}</button><button type="button" className="t-btn ghost" onClick={() => setConfirmReset(false)}>{tr("取消", "Cancel")}</button></>
        : <button type="button" className="t-btn ghost" onClick={() => setConfirmReset(true)}><RotateCcw size={14} />{tr("重置账户", "Reset account")}</button>}</div>
    </div>

    <div className="t-cols">
      <Panel code="POS" title={tr("持仓 · 实时盯市", "Positions · marked live")} right={<span>{live.updatedAt ? `Yahoo Finance · ${ago(live.updatedAt, lang)}` : ""}</span>} className="t-span2">
        {!positions.length ? <p className="t-empty">{tr("还没有持仓。到 AI 助手里聊出一份策略书，点「部署到模拟沙箱」。", "No positions yet. Ask the AI agent for a strategy and deploy it to the sandbox.")}</p> : <>
          <div className="t-alloc-bar big">{positions.map((p, i) => <i key={p.symbol} style={{ width: `${p.value / nav * 100}%`, background: LEG_COLORS[i % LEG_COLORS.length] }} title={`${p.symbol} ${(p.value / nav * 100).toFixed(1)}%`} />)}<i className="cash" style={{ width: `${cash / nav * 100}%` }} /></div>
          <table className="t-table">
            <thead><tr><th>{tr("标的", "Symbol")}</th><th>{tr("数量", "Qty")}</th><th>{tr("成本", "Avg cost")}</th><th>{tr("最新", "Last")}</th><th>{tr("市值", "Value")}</th><th>{tr("盈亏", "P&L")}</th><th>{tr("权重", "Weight")}</th><th /></tr></thead>
            <tbody>{positions.map((p, i) => {
              const asset = findAsset(p.symbol)
              return <tr key={p.symbol}>
                <td><span className="t-swatch" style={{ background: LEG_COLORS[i % LEG_COLORS.length] }} /><span className="t-sym">{p.symbol}</span><small className="t-dim"> {asset ? assetName(asset, lang) : ""}</small></td>
                <td className="t-num">{p.qty}</td>
                <td className="t-num t-dim">{fmtPrice(p.cost, p.symbol)}</td>
                <td><FlashNumber value={p.last} flash={live.flashes[p.symbol]}>{fmtPrice(p.last, p.symbol)}</FlashNumber> <LiveDot status={p.quote ? p.quote.open ? "open" : "closed" : "idle"} /></td>
                <td className="t-num">{fmtMoney(p.value, 2)}</td>
                <td className={`t-num ${p.pnl >= 0 ? "t-up" : "t-down"}`}>{fmtMoney(p.pnl, 2)}<small> {fmtPct(p.pnlPct, 2, true)}</small></td>
                <td className="t-num t-dim">{(p.value / nav * 100).toFixed(1)}%</td>
                <td><button type="button" className="t-btn ghost small" onClick={() => setTheater({ kind: "close", symbol: p.symbol })}><X size={12} />{tr("平仓", "Close")}</button></td>
              </tr>
            })}</tbody>
          </table></>}
      </Panel>

      <Panel code="EXE" title={tr("执行记录", "Executions")}>
        {!portfolio?.executions.length ? <p className="t-empty">{tr("暂无执行", "No executions yet")}</p> : <ol className="t-timeline">{portfolio.executions.map(e => <li key={e.id}>
          <span className={`t-pill ${e.kind === "close" ? "closed" : "open"}`}>{e.kind === "close" ? tr("平仓", "CLOSE") : tr("策略", "STRATEGY")}</span>
          <b>{e.title}</b>
          <small className="t-dim">{e.strategy_ref ?? ""} · {new Date(e.created_at).toLocaleString(lang === "en" ? "en-US" : "zh-CN", { hour12: false })}</small>
          <small className="t-num">{fmtMoney(e.cash_before)} → {fmtMoney(e.cash_after)}</small>
        </li>)}</ol>}
      </Panel>
    </div>

    <Panel code="ORD" title={tr("成交明细 · 报价与预言机留痕", "Fills · quote & oracle audit trail")} right={<span>{portfolio?.mode === "db" ? "public.sandbox_orders" : "localStorage"}</span>}>
      {!portfolio?.orders.length ? <p className="t-empty">{tr("暂无成交", "No fills yet")}</p> : <table className="t-table compact">
        <thead><tr><th>{tr("时间", "Time")}</th><th>{tr("方向", "Side")}</th><th>{tr("标的", "Symbol")}</th><th>{tr("数量", "Qty")}</th><th>{tr("报价", "Quote")}</th><th>{tr("时段", "Session")}</th><th>{tr("成交价", "Fill")}</th><th>{tr("滑点", "Slip")}</th><th>{tr("费用", "Fee")}</th><th>Chainlink</th><th>{tr("偏离", "Dev.")}</th></tr></thead>
        <tbody>{portfolio.orders.map(o => <tr key={o.id}>
          <td className="t-dim">{new Date(o.created_at).toLocaleTimeString("en-GB", { hour12: false })}</td>
          <td><span className={`t-side ${o.side}`}>{o.side === "buy" ? "BUY" : "SELL"}</span></td>
          <td className="t-sym">{o.symbol}</td>
          <td className="t-num">{o.qty}</td>
          <td className="t-num">{fmtPrice(o.quote_price, o.symbol)}</td>
          <td><span className={`t-pill ${o.session}`}>{o.session === "open" ? tr("交易中", "open") : tr("闭市", "closed")}</span></td>
          <td className="t-num">{fmtPrice(o.fill_price, o.symbol)}</td>
          <td className="t-num t-dim">{o.slippage_bps}bp</td>
          <td className="t-num t-dim">{fmtMoney(o.fee, 2)}</td>
          <td className="t-num">{o.oracle_price ? fmtPrice(o.oracle_price, o.symbol) : "—"}</td>
          <td className="t-num t-dim">{o.oracle_price ? `${((o.quote_price / o.oracle_price - 1) * 100).toFixed(2)}%` : ""}</td>
        </tr>)}</tbody>
      </table>}
    </Panel>
    {theater && <ExecutionTheater request={theater} onClose={() => setTheater(null)} />}
  </div>
}

export function PortfolioView() {
  return <div className="term t-exchange w-full min-w-0 h-full overflow-y-auto"><RequireAccount><Portfolio /></RequireAccount></div>
}
