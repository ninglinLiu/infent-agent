"use client"

import { createContext, useContext, useState } from "react"

export type ViewId =
  | "workspace"
  | "agent"
  | "markets"
  | "discover"
  | "backtest"
  | "risk"
  | "journal"
  | "settings"

type ViewCtx = {
  view: ViewId
  setView: (v: ViewId) => void
}

const Ctx = createContext<ViewCtx | null>(null)

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ViewId>("workspace")
  return <Ctx.Provider value={{ view, setView }}>{children}</Ctx.Provider>
}

export function useView() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useView must be used inside ViewProvider")
  return ctx
}
