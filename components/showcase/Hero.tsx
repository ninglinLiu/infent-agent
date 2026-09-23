"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { Orbs } from "./Orbs"
import { TOP_TICKERS } from "@/lib/mock/market"
import { useLang } from "@/lib/i18n"
import { useShowcaseCopy } from "@/lib/showcase-copy"

export function Hero() {
  const { lang } = useLang()
  const c = useShowcaseCopy()
  const zh = lang === "zh"

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      <Orbs />

      <div className="relative z-10 sec-x flex-1 flex flex-col justify-center pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span className="chip-pill text-[11px]">
            <Sparkles className="h-3 w-3 text-[#00ff9f]" />
            {c.hero.eyebrow}
          </span>
          <span className="chip-pill text-[11px] text-[var(--fg-2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00ff9f] animate-pulse" />
            {c.hero.live}
          </span>
        </motion.div>

        <motion.h1
          key={lang}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className={`display-xxl mt-6 text-[clamp(48px,9vw,156px)] max-w-[1400px] ${zh ? "break-keep" : ""}`}
        >
          <span className="text-white">{c.hero.title1}</span>
          <br />
          <span className="text-gradient-wallet">{c.hero.title2}</span>
          <br />
          <span className="text-white/80 text-[0.7em] font-semibold">{c.hero.title3}</span>
        </motion.h1>

        <motion.p
          key={`${lang}-lead`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 max-w-[720px] text-[17px] sm:text-[19px] text-[var(--fg-1)] leading-relaxed"
        >
          {c.hero.leadBefore}
          {zh ? "" : " "}
          <span className="text-white font-semibold">{c.hero.leadHighlights[0]}</span>
          {zh ? "、" : ", "}
          <span className="text-white font-semibold">{c.hero.leadHighlights[1]}</span>
          {zh ? "、" : ", "}
          <span className="text-white font-semibold">{c.hero.leadHighlights[2]}</span>
          {zh ? "与" : ", and "}
          <span className="text-white font-semibold">{c.hero.leadHighlights[3]}</span>
          {zh ? "" : " "}
          {c.hero.leadAfter}
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
            {c.hero.cta}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </Link>
          <a
            href="#solution"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold border border-white/15 hover:border-white/40 hover:bg-white/5 transition"
          >
            {c.hero.explore}
          </a>
          <div className="flex items-center gap-2 ml-2 text-[12px] text-[var(--fg-3)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00ff9f]" />
            {c.common.team}
          </div>
        </motion.div>

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

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 border-t border-white/5 pt-10 max-w-[1100px]">
          {c.hero.stats.map((s) => (
            <Stat key={s.k} k={s.k} v={s.v} />
          ))}
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
