"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Blocks, Bot, MessageSquare, ShieldCheck } from "lucide-react"
import { Orbs } from "./Orbs"

const SOLUTIONS = [
  {
    pain: "Non-financial professionals lack systematic financial knowledge.",
    solution: "Simplify and embed financial reasoning into every AI output — footnotes, one-line rationale, beginner glossary.",
    accent: "from-[#00ff9f] via-[#22d3ee] to-[#60a5fa]",
  },
  {
    pain: "Ordinary investors rely on intuition, leading to mistakes.",
    solution: "AI-driven objective analysis of macro factors, sector rotation, and sentiment — stress-tested before execution.",
    accent: "from-[#ff6aa8] via-[#c4b5fd] to-[#8b5cf6]",
  },
  {
    pain: "No user-friendly alternative to Wind / Bloomberg.",
    solution: "A lightweight conversational console — ask in natural language, get executable strategy cards, one-click apply.",
    accent: "from-[#ffb547] via-[#ff6aa8] to-[#ff4fd8]",
  },
]

const FUNCTIONS = [
  {
    icon: Blocks,
    title: "End-to-end advisory workflow",
    body: "User profiling → strategy generation → risk monitoring → portfolio optimization, all in one flow.",
    color: "#00ff9f",
  },
  {
    icon: MessageSquare,
    title: "Conversational interface",
    body: "Ask any investment question in plain Mandarin or English. Agent returns ranked strategies with AI reasoning.",
    color: "#22d3ee",
  },
  {
    icon: ShieldCheck,
    title: "Live portfolio risk",
    body: "Real-time sharpe, drawdown, VaR, sector exposure and sentiment indicators — all at a glance.",
    color: "#ff6aa8",
  },
]

export function SolutionSection() {
  return (
    <section id="solution" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="hot" />
      <div className="relative z-10 sec-x">
        <div className="mb-16">
          <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
            <span className="text-[#ff6aa8]">02</span> · Proposed Innovative Solution
          </span>
          <h2 className="display-xxl text-[clamp(44px,6vw,96px)] max-w-[1200px]">
            From <span className="text-gradient-amber">pain point</span> to{" "}
            <span className="text-gradient-green">one-click strategy.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {SOLUTIONS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="card-glow p-7 lg:p-8"
            >
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--fg-3)] mb-3">Pain</div>
              <p className="text-[15.5px] leading-relaxed text-[var(--fg-1)] mb-6">{s.pain}</p>
              <div className={`h-px w-full bg-gradient-to-r ${s.accent} mb-6 opacity-80`} />
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--fg-3)] mb-3">Solution</div>
              <p className="text-[15.5px] leading-relaxed text-white">{s.solution}</p>
            </motion.div>
          ))}
        </div>

        {/* 3 functions bar */}
        <div className="mt-24 rounded-[28px] border-soft-strong p-6 md:p-10 bg-gradient-to-br from-white/[0.04] to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <span className="chip-pill text-[11px]">
                <Bot className="h-3 w-3 text-[#00ff9f]" />
                Product functions
              </span>
              <h3 className="display-xxl mt-3 text-[clamp(28px,3.2vw,48px)]">
                Three pillars, shipping today.
              </h3>
            </div>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold bg-white text-black hover:bg-[#00ff9f] transition"
            >
              Try live console
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {FUNCTIONS.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="group relative rounded-2xl border border-white/8 p-6 hover:border-white/25 transition"
                  style={{ background: `linear-gradient(180deg, ${f.color}11, transparent 60%)` }}
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center mb-5"
                    style={{
                      background: `${f.color}22`,
                      border: `1px solid ${f.color}44`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: f.color }} />
                  </div>
                  <div className="text-[11px] text-[var(--fg-3)] mb-1">Function 0{i + 1}</div>
                  <h4 className="font-display text-2xl font-semibold mb-3">{f.title}</h4>
                  <p className="text-[14px] text-[var(--fg-2)] leading-relaxed">{f.body}</p>
                </div>
              )
            })}
          </div>
          <p className="mt-6 text-[12px] text-[var(--fg-3)] italic">
            Please look forward to more functions. — Group 3
          </p>
        </div>
      </div>
    </section>
  )
}
