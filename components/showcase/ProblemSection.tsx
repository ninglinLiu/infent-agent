"use client"

import { motion } from "framer-motion"
import { AlertTriangle, BookOpen, BrainCircuit } from "lucide-react"
import { Orbs } from "./Orbs"

const PAINS = [
  {
    icon: BookOpen,
    tag: "Group Pain Point",
    title: "Knowledge gap",
    body: "Most non-financial professionals want to invest in stocks/funds but lack systematic financial knowledge — they can't read a balance sheet, can't parse jargon, and can't debate a thesis.",
    accent: "from-[#00ff9f] to-[#22d3ee]",
  },
  {
    icon: BrainCircuit,
    tag: "Decision Dilemma",
    title: "Intuition-driven",
    body: "Without practical experience, ordinary investors rely on gut feeling, facing frequent mistakes and market risks — buy high, sell low, and repeat.",
    accent: "from-[#ff6aa8] to-[#8b5cf6]",
  },
  {
    icon: AlertTriangle,
    tag: "Supply Gap",
    title: "Tools for pros only",
    body: "Existing products target institutions (Wind, Bloomberg) — dense jargon, paid subscriptions, steep learning curves. Mass-market apps are superficial. Nothing in between.",
    accent: "from-[#ffb547] to-[#ff4fd8]",
  },
]

export function ProblemSection() {
  return (
    <section id="problem" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="cool" />
      <div className="relative z-10 sec-x">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
          <div>
            <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
              <span className="text-[#22d3ee]">01</span> · Opportunity & Problem Identification
            </span>
            <h2 className="display-xxl text-[clamp(44px,6vw,96px)] max-w-[900px]">
              Three gaps in the <span className="text-gradient-pink">cyber-finance</span> market.
            </h2>
          </div>
          <p className="max-w-[460px] text-[15px] text-[var(--fg-2)] leading-relaxed">
            When we mapped how AI is actually deployed in financial markets today, we found three
            structural gaps — the same gaps every ordinary investor runs into on day one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PAINS.map((p, i) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="card-glow p-7 md:p-8 flex flex-col justify-between min-h-[340px]"
              >
                <div>
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${p.accent} flex items-center justify-center mb-6`}
                  >
                    <Icon className="h-5 w-5 text-black" />
                  </div>
                  <div className="text-[11px] text-[var(--fg-3)] uppercase tracking-[0.2em] mb-2">
                    {p.tag}
                  </div>
                  <h3 className="font-display text-3xl md:text-4xl font-semibold mb-4">{p.title}</h3>
                  <p className="text-[14.5px] text-[var(--fg-1)] leading-relaxed">{p.body}</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[11px] text-[var(--fg-3)]">
                  <span className="font-mono-ui">0{i + 1}</span>
                  <div className="flex-1 h-px bg-white/10" />
                  <span>Pain point</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
