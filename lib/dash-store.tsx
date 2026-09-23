"use client"

import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from "react"
import { INITIAL_PORTFOLIO, SECTORS, type Holding, type SectorCell } from "@/lib/mock/market"
import { STRATEGIES, type Strategy, type StrategyAction } from "@/lib/mock/agent"
import { DEFAULT_INSTRUMENT, resolveInstrument } from "@/lib/market/presets"
import type { ChartInterval, Instrument } from "@/lib/market/types"

// An execution marker placed on the K-line chart
export type ExecMark = {
  id: string
  kind: "buy" | "sell"
  symbol: string
  label: string
  idxRatio: number // 0..1 along the displayed candle range
  price: number
  createdAt: number
}

export type Metrics = {
  nav: number // portfolio net asset value ($)
  pnlDay: number
  pnlDayPct: number
  sharpe: number
  winRate: number
}

export type StrategyRun = {
  strategy: Strategy
  step: number
  startedAt: number
  finishedAt?: number
}

type State = {
  theme: "dark" | "light"
  metrics: Metrics
  holdings: Holding[]
  sectors: SectorCell[]
  activeStrategyId: string | null
  runs: StrategyRun[]
  toast: { id: string; tone: "up" | "down" | "info"; text: { zh: string; en: string } } | null
  chartInstrument: Instrument
  chartInterval: ChartInterval
}

type Action =
  | { type: "SET_THEME"; theme: "dark" | "light" }
  | { type: "EXECUTE_STRATEGY"; strategyId: string }
  | { type: "ADVANCE_STEP"; strategyId: string }
  | { type: "FINISH_STRATEGY"; strategyId: string }
  | { type: "APPLY_ACTION"; action: StrategyAction; strategyId: string }
  | { type: "TOAST"; toast: State["toast"] }
  | { type: "RESET" }
  | { type: "SET_CHART_INSTRUMENT"; instrument: Instrument }
  | { type: "SET_CHART_INTERVAL"; interval: ChartInterval }

const INITIAL_METRICS: Metrics = {
  nav: 248_320.18,
  pnlDay: 1_842.6,
  pnlDayPct: 0.0075,
  sharpe: 1.41,
  winRate: 0.58,
}

const initialState: State = {
  theme: "dark",
  metrics: INITIAL_METRICS,
  holdings: INITIAL_PORTFOLIO,
  sectors: SECTORS,
  activeStrategyId: null,
  runs: [],
  toast: null,
  chartInstrument: DEFAULT_INSTRUMENT,
  chartInterval: "60",
}

function applyActionToHoldings(holdings: Holding[], a: StrategyAction): Holding[] {
  return holdings.map((h) => {
    if (h.symbol !== a.symbol) return h
    if (a.kind === "alloc") return { ...h, weight: a.target }
    if (a.kind === "buy") {
      return {
        ...h,
        qty: Math.max(1, Math.round(h.qty * (1 + a.qtyPct * 4))),
        weight: Math.min(0.4, h.weight + a.qtyPct),
      }
    }
    if (a.kind === "sell") {
      return {
        ...h,
        qty: Math.max(1, Math.round(h.qty * (1 - a.qtyPct * 4))),
        weight: Math.max(0, h.weight - a.qtyPct),
      }
    }
    return h
  })
}

function applyActionToSectors(sectors: SectorCell[], strat: Strategy): SectorCell[] {
  return sectors.map((s) => {
    const delta = strat.sectorImpact[s.name]
    if (!delta) return s
    return { ...s, chg: +(s.chg + delta).toFixed(2) }
  })
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_THEME":
      return { ...state, theme: action.theme }
    case "EXECUTE_STRATEGY": {
      const strat = STRATEGIES[action.strategyId]
      if (!strat) return state
      return {
        ...state,
        activeStrategyId: strat.id,
        runs: [...state.runs, { strategy: strat, step: 0, startedAt: Date.now() }],
        sectors: applyActionToSectors(state.sectors, strat),
        toast: {
          id: `t-${Date.now()}`,
          tone: "info",
          text: { zh: `正在执行：${strat.name}`, en: `Executing: ${strat.nameEn}` },
        },
      }
    }
    case "APPLY_ACTION": {
      const strat = STRATEGIES[action.strategyId]
      if (!strat) return state
      const newHoldings = applyActionToHoldings(state.holdings, action.action)
      const bump = strat.expectedReturn / (strat.actions.length * 10)
      const pnlBump = state.metrics.nav * bump
      const newPnlDay = state.metrics.pnlDay + pnlBump
      const newNav = state.metrics.nav + pnlBump
      return {
        ...state,
        holdings: newHoldings,
        metrics: {
          nav: +newNav.toFixed(2),
          pnlDay: +newPnlDay.toFixed(2),
          pnlDayPct: +(newPnlDay / newNav).toFixed(4),
          sharpe: +(state.metrics.sharpe + strat.sharpe / strat.actions.length).toFixed(2),
          winRate: +Math.min(
            0.95,
            state.metrics.winRate + (strat.winRate - 0.5) / strat.actions.length
          ).toFixed(3),
        },
      }
    }
    case "ADVANCE_STEP":
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.strategy.id === action.strategyId
            ? { ...r, step: Math.min(r.step + 1, r.strategy.actions.length) }
            : r
        ),
      }
    case "FINISH_STRATEGY": {
      const strat = STRATEGIES[action.strategyId]
      return {
        ...state,
        activeStrategyId: null,
        runs: state.runs.map((r) =>
          r.strategy.id === action.strategyId
            ? { ...r, finishedAt: Date.now(), step: r.strategy.actions.length }
            : r
        ),
        toast: {
          id: `t-${Date.now()}`,
          tone: "up",
          text: {
            zh: `${strat?.name ?? "策略"} 执行完成 · 预期年化 +${((strat?.expectedReturn ?? 0) * 100).toFixed(1)}%`,
            en: `${strat?.nameEn ?? "Strategy"} completed · expected +${((strat?.expectedReturn ?? 0) * 100).toFixed(1)}%`,
          },
        },
      }
    }
    case "TOAST":
      return { ...state, toast: action.toast }
    case "SET_CHART_INSTRUMENT":
      return { ...state, chartInstrument: action.instrument }
    case "SET_CHART_INTERVAL":
      return { ...state, chartInterval: action.interval }
    case "RESET":
      return initialState
    default:
      return state
  }
}

type Ctx = State & {
  marks: ExecMark[]
  executeStrategy: (id: string) => void
  clearToast: () => void
  setTheme: (t: "dark" | "light") => void
  resetAll: () => void
  setChartInstrument: (instrument: Instrument) => void
  setChartInterval: (interval: ChartInterval) => void
  selectSymbol: (input: string) => void
}

const DashContext = createContext<Ctx | null>(null)

export function DashProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [marks, markDispatch] = useReducer(
    (prev: ExecMark[], a: { type: "add"; mark: ExecMark } | { type: "reset" }) =>
      a.type === "add" ? [...prev, a.mark].slice(-12) : [],
    [] as ExecMark[]
  )
  const counter = useRef(0)

  const executeStrategy = useCallback((id: string) => {
    const strat = STRATEGIES[id]
    if (!strat) return
    dispatch({ type: "EXECUTE_STRATEGY", strategyId: id })
    const firstTrade = strat.actions.find((a) => a.kind === "buy" || a.kind === "sell")
    if (firstTrade) {
      const inst = resolveInstrument(firstTrade.symbol)
      if (inst) dispatch({ type: "SET_CHART_INSTRUMENT", instrument: inst })
    }
    strat.actions.forEach((act, idx) => {
      const delay = 500 + idx * 700
      setTimeout(() => {
        dispatch({ type: "APPLY_ACTION", action: act, strategyId: id })
        dispatch({ type: "ADVANCE_STEP", strategyId: id })
        if (act.kind === "buy" || act.kind === "sell") {
          counter.current += 1
          markDispatch({
            type: "add",
            mark: {
              id: `m-${counter.current}`,
              kind: act.kind,
              symbol: act.symbol,
              label: `${act.kind === "buy" ? "BUY" : "SELL"} ${act.symbol}`,
              idxRatio: 0.55 + (idx / Math.max(1, strat.actions.length - 1)) * 0.35,
              price: 180 + (idx + 1) * 4,
              createdAt: Date.now(),
            },
          })
          dispatch({
            type: "TOAST",
            toast: {
              id: `t-${counter.current}`,
              tone: act.kind === "buy" ? "up" : "down",
              text: {
                zh: `${act.kind === "buy" ? "买入" : "卖出"} ${act.symbol} · ${Math.round(act.qtyPct * 100)}% 仓位`,
                en: `${act.kind === "buy" ? "Bought" : "Sold"} ${act.symbol} · ${Math.round(act.qtyPct * 100)}% of portfolio`,
              },
            },
          })
        }
      }, delay)
    })
    setTimeout(
      () => dispatch({ type: "FINISH_STRATEGY", strategyId: id }),
      500 + strat.actions.length * 700 + 700
    )
  }, [])

  const clearToast = useCallback(() => dispatch({ type: "TOAST", toast: null }), [])
  const setTheme = useCallback((t: "dark" | "light") => dispatch({ type: "SET_THEME", theme: t }), [])
  const setChartInstrument = useCallback(
    (instrument: Instrument) => dispatch({ type: "SET_CHART_INSTRUMENT", instrument }),
    []
  )
  const setChartInterval = useCallback(
    (interval: ChartInterval) => dispatch({ type: "SET_CHART_INTERVAL", interval }),
    []
  )
  const selectSymbol = useCallback((input: string) => {
    const resolved = resolveInstrument(input)
    if (resolved) {
      dispatch({ type: "SET_CHART_INSTRUMENT", instrument: resolved })
      return
    }
    const symbol = input.trim().toUpperCase()
    if (!symbol || symbol === "CASH") return
    dispatch({
      type: "SET_CHART_INSTRUMENT",
      instrument: {
        symbol,
        name: symbol,
        nameEn: symbol,
        market: "",
        yahoo: symbol,
      },
    })
  }, [])
  const resetAll = useCallback(() => {
    dispatch({ type: "RESET" })
    markDispatch({ type: "reset" })
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      marks,
      executeStrategy,
      clearToast,
      setTheme,
      resetAll,
      setChartInstrument,
      setChartInterval,
      selectSymbol,
    }),
    [
      state,
      marks,
      executeStrategy,
      clearToast,
      setTheme,
      resetAll,
      setChartInstrument,
      setChartInterval,
      selectSymbol,
    ]
  )

  return <DashContext.Provider value={value}>{children}</DashContext.Provider>
}

export function useDash() {
  const ctx = useContext(DashContext)
  if (!ctx) throw new Error("useDash must be used inside DashProvider")
  return ctx
}
