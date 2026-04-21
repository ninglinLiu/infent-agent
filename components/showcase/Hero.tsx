"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { Orbs } from "./Orbs"
import { BRAND } from "@/lib/brand"
import { TOP_TICKERS } from "@/lib/mock/market"

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      <Orbs />

      <div className="relative z-10 sec-x flex-1 flex flex-col justify-center pt-28 pb-16">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2"
        >
          <span className="chip-pill text-[11px]">
            <Sparkles className="h-3 w-3 text-[#00ff9f]" />
            v2025.11 · AI for ordinary investors
          </span>
          <span className="chip-pill text-[11px] text-[var(--fg-2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00ff9f] animate-pulse" />
            Live demo running
          </span>
        </motion.div>

        {/* Big display headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="display-xxl mt-6 text-[clamp(48px,9vw,156px)] max-w-[1400px]"
        >
          <span className="text-white">Omni-Intelligent</span>
          <br />
          <span className="text-gradient-wallet">Investment Advisor</span>
          <br />
          <span className="text-white/80 text-[0.7em] font-semibold">& Risk Management AI.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 max-w-[720px] text-[17px] sm:text-[19px] text-[var(--fg-1)] leading-relaxed"
        >
          Professional-grade financial analysis, beginner-friendly understanding.
          An end-to-end AI advisory workflow combining{" "}
          <span className="text-white font-semibold">user profiling</span>,{" "}
          <span className="text-white font-semibold">strategy generation</span>,{" "}
          <span className="text-white font-semibold">live risk monitoring</span>, and{" "}
          <span className="text-white font-semibold">one-click portfolio execution</span> — designed for the 900M
          ordinary investors that Wind & Bloomberg forgot.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold bg-[#00ff9f] text-black hover:brightness-110 transition"
          >
            Launch Console
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </Link>
          <a
            href="#solution"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold border border-white/15 hover:border-white/40 hover:bg-white/5 transition"
          >
            Explore how it works
          </a>
          <div className="flex items-center gap-2 ml-2 text-[12px] text-[var(--fg-3)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00ff9f]" />
            {BRAND.team}
          </div>
        </motion.div>

        {/* Ticker bar — live feel */}
        <div className="relative mt-16 ticker-mask">
          <div className="flex gap-8 whitespace-nowrap marquee-track py-2 opacity-80">
            {[...TOP_TICKERS, ...TOP_TICKERS].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px]">
                <span className="text-[var(--fg-3)] font-mono-ui">{t.sym}</span>
                <span className="tabular text-white">{t.px.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className={`tabular font-mono-ui ${t.chg >= 0 ? "text-[#00ff9f]" : "text-[#ff3b5c]"}`}>
                  {t.chg >= 0 ? "+" : ""}
                  {t.chg.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Corner numeric frame — WalletConnect style */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 border-t border-white/5 pt-10 max-w-[1100px]">
          <Stat k="900M+" v="Ordinary investors underserved by pro tools" />
          <Stat k="< 30s" v="From natural-language question to executable strategy" />
          <Stat k="3" v="Market gaps uniquely addressed by our system" />
          <Stat k="100%" v="Conclusions translated into plain language" />
        </div>
      </div>
    </section>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="display-xxl text-[clamp(36px,4.2vw,64px)] text-gradient-green">{k}</div>
      <div className="mt-2 text-[12.5px] text-[var(--fg-2)] leading-relaxed max-w-[220px]">{v}</div>
    </div>
  )
}
