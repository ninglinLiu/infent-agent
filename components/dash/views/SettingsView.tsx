"use client"

import { useState } from "react"
import { useDash } from "@/lib/dash-store"
import { Bell, Moon, Palette, Shield, Sun, User } from "lucide-react"
import { BRAND } from "@/lib/brand"

export function SettingsView() {
  const { theme, setTheme } = useDash()
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")
  const [risk, setRisk] = useState(0.5)
  const [horizon, setHorizon] = useState("mid")
  const [notify, setNotify] = useState(true)

  return (
    <div className="h-full overflow-y-auto thin-scroll pr-1">
      <div className="max-w-[1000px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card icon={User} title="Investor profile">
          <Row k="Display name" v="Demo User" />
          <Row k="Capital band" v="$100K – $500K" />
          <Row k="Onboarding" v="Completed · 2025-11-01" />
          <div className="mt-4">
            <div className="text-[11px] text-dim mb-2">Risk tolerance · {Math.round(risk * 100)}</div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={risk}
              onChange={(e) => setRisk(parseFloat(e.target.value))}
              className="w-full accent-[#00ff9f]"
            />
            <div className="flex justify-between text-[10px] text-ghost mt-1">
              <span>Conservative</span><span>Aggressive</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[11px] text-dim mb-2">Investment horizon</div>
            <div className="grid grid-cols-3 gap-1.5">
              {["short", "mid", "long"].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`py-2 rounded-md text-[12px] border transition ${
                    horizon === h
                      ? "border-up text-up bg-[rgba(0,255,159,0.08)]"
                      : "border-[var(--line-1)] text-dim hover:text-white"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card icon={Palette} title="Appearance">
          <Row k="Theme" v={theme === "dark" ? "Dark (default)" : "Light"} />
          <button
            onClick={toggleTheme}
            className="mt-2 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-semibold border border-[var(--line-1)] hover:bg-[var(--bg-3)] transition"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            Toggle theme
          </button>
          <div className="mt-6">
            <div className="text-[11px] text-dim mb-2">Accent palette</div>
            <div className="flex gap-2">
              {["#00ff9f", "#22d3ee", "#ff6aa8", "#ffb547", "#8b5cf6"].map((c) => (
                <div
                  key={c}
                  className="h-8 w-8 rounded-md cursor-pointer ring-1 ring-white/10 hover:ring-white/40 transition"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card icon={Bell} title="Notifications">
          <Toggle
            label="Daily AI Alpha brief"
            hint="07:30 delivery · email + in-app"
            v={notify}
            onChange={setNotify}
          />
          <Toggle label="Stop-loss triggered" hint="Immediate push" v={true} onChange={() => {}} />
          <Toggle label="Portfolio drift > 5%" hint="Rebalance reminder" v={true} onChange={() => {}} />
          <Toggle label="Community signals" hint="Top-0.1% trader moves" v={false} onChange={() => {}} />
        </Card>

        <Card icon={Shield} title="Account & security">
          <Row k="Broker" v="Demo paper account" />
          <Row k="API key" v="····-····-····-8c93" />
          <Row k="Two-factor auth" v="On · Authenticator app" />
          <Row k="Data region" v="Singapore" />
          <div className="mt-4 text-[11px] text-ghost">
            Project: {BRAND.full}
          </div>
          <div className="text-[11px] text-ghost">{BRAND.team}</div>
        </Card>
      </div>
    </div>
  )
}

function Card({
  icon: Icon, title, children,
}: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-3.5 w-3.5 text-info" />
        <span className="text-[11px] uppercase tracking-wider text-dim">{title}</span>
      </div>
      {children}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--line-1)] last:border-b-0">
      <span className="text-[12px] text-dim">{k}</span>
      <span className="text-[13px] text-white tabular">{v}</span>
    </div>
  )
}

function Toggle({
  label, hint, v, onChange,
}: { label: string; hint?: string; v: boolean; onChange: (b: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--line-1)] last:border-b-0">
      <div>
        <div className="text-[13px]">{label}</div>
        {hint && <div className="text-[11px] text-ghost">{hint}</div>}
      </div>
      <button
        onClick={() => onChange(!v)}
        className={`relative h-5 w-9 rounded-full transition ${v ? "bg-up" : "bg-[var(--bg-3)]"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            v ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  )
}
