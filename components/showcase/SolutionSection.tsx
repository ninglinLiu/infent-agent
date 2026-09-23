"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Blocks, Bot, MessageSquare, ShieldCheck } from "lucide-react"
import { Orbs } from "./Orbs"
import { useLang } from "@/lib/i18n"
import { useShowcaseCopy } from "@/lib/showcase-copy"

const ACCENTS = [
  "from-[#00ff9f] via-[#22d3ee] to-[#60a5fa]",
  "from-[#ff6aa8] via-[#c4b5fd] to-[#8b5cf6]",
  "from-[#ffb547] via-[#ff6aa8] to-[#ff4fd8]",
]
const FUNC_ICONS = [Blocks, MessageSquare, ShieldCheck]
const FUNC_COLORS = ["#00ff9f", "#22d3ee", "#ff6aa8"]

export function SolutionSection() {
  const { lang } = useLang()
  const c = useShowcaseCopy()
  const zh = lang === "zh"

  return (
    <section id="solution" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="hot" />
      <div className="relative z-10 sec-x">
        <div className="mb-16">
          <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
            <span className="text-[#ff6aa8]">02</span> · {c.solution.kicker}
          </span>
          <h2 className={`display-xxl text-[clamp(44px,6vw,96px)] max-w-[1200px] ${zh ? "break-keep" : ""}`}>
            {c.solution.titleBefore}
            {zh ? "" : " "}
            <span className="text-gradient-amber">{c.solution.titlePain}</span>
            {zh ? "" : " "}
            {c.solution.titleMid}
            {zh ? "" : " "}
            <span className="text-gradient-green">{c.solution.titleClick}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {c.solution.pairs.map((s, i) => (
            <motion.div
              key={`${lang}-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="card-glow p-7 lg:p-8"
            >
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--fg-3)] mb-3">{c.solution.painLabel}</div>
              <p className="text-[15.5px] leading-relaxed text-[var(--fg-1)] mb-6">{s.pain}</p>
              <div className={`h-px w-full bg-gradient-to-r ${ACCENTS[i]} mb-6 opacity-80`} />
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--fg-3)] mb-3">{c.solution.solutionLabel}</div>
              <p className="text-[15.5px] leading-relaxed text-white">{s.solution}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 rounded-[28px] border-soft-strong p-6 md:p-10 bg-gradient-to-br from-white/[0.04] to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <span className="chip-pill text-[11px]">
                <Bot className="h-3 w-3 text-[#00ff9f]" />
                {c.solution.functionsKicker}
              </span>
              <h3 className="display-xxl mt-3 text-[clamp(28px,3.2vw,48px)]">{c.solution.functionsTitle}</h3>
            </div>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold bg-white text-black hover:bg-[#00ff9f] transition"
            >
              {c.solution.tryConsole}
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {c.solution.functions.map((f, i) => {
              const Icon = FUNC_ICONS[i]
              const color = FUNC_COLORS[i]
              return (
                <div
                  key={`${lang}-${i}`}
                  className="group relative rounded-2xl border border-white/8 p-6 hover:border-white/25 transition"
                  style={{ background: `linear-gradient(180deg, ${color}11, transparent 60%)` }}
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center mb-5"
                    style={{
                      background: `${color}22`,
                      border: `1px solid ${color}44`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="text-[11px] text-[var(--fg-3)] mb-1">
                    {c.solution.functionLabel} 0{i + 1}
                  </div>
                  <h4 className="font-display text-2xl font-semibold mb-3">{f.title}</h4>
                  <p className="text-[14px] text-[var(--fg-2)] leading-relaxed">{f.body}</p>
                </div>
              )
            })}
          </div>
          <p className="mt-6 text-[12px] text-[var(--fg-3)] italic">{c.solution.more}</p>
        </div>
      </div>
    </section>
  )
}
