"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { Orbs } from "./Orbs"

const PRO = {
  name: "Professional tools",
  example: "Wind · Bloomberg Terminal · Refinitiv",
  target: "Institutions & seasoned practitioners",
  drawbacks: [
    "Complex functions, dense jargon",
    "High learning curve",
    "Paid subscriptions ($24K+/yr)",
    "Not accessible to ordinary investors",
  ],
  tone: { border: "border-white/10", pill: "text-[var(--fg-3)]" },
}

const MASS = {
  name: "Mass-market tools",
  example: "Wealth management apps · Robo-advisors",
  target: "Ordinary users",
  drawbacks: [
    "Single-dimensional analysis",
    "Superficial conclusions",
    "Relies on basic data",
    "Lacks professional reasoning logic",
  ],
  tone: { border: "border-white/10", pill: "text-[var(--fg-3)]" },
}

const US = {
  name: "Omni-Intelligent AI",
  example: "Our solution",
  target: "The 900M underserved ordinary investors",
  wins: [
    "AI-powered with financial knowledge graphs",
    "Multi-dimensional data fusion",
    "Jargon automatically translated to plain language",
    "Professional-grade analysis, beginner-friendly UX",
    "Conversational, one-click executable strategies",
  ],
}

export function LandscapeSection() {
  return (
    <section id="landscape" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="soft" />
      <div className="relative z-10 sec-x">
        <div className="mb-16 max-w-[1200px]">
          <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
            <span className="text-[#8b5cf6]">03</span> · Competitive Landscape
          </span>
          <h2 className="display-xxl text-[clamp(44px,6vw,96px)]">
            The market is <span className="text-gradient-pink">polarised.</span>
            <br />
            We fill the <span className="text-gradient-green">middle.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Pro tools */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className={`card-glow p-7 lg:p-8 ${PRO.tone.border}`}
          >
            <div className={`chip-pill mb-5 ${PRO.tone.pill}`}>Pro</div>
            <h3 className="font-display text-3xl font-semibold mb-2">{PRO.name}</h3>
            <div className="text-[12px] text-[var(--fg-3)] mb-6 font-mono-ui">{PRO.example}</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">Target</div>
            <p className="text-[14px] text-[var(--fg-1)] mb-6">{PRO.target}</p>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">Drawbacks</div>
            <ul className="space-y-2">
              {PRO.drawbacks.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-[13.5px] text-[var(--fg-2)]">
                  <X className="h-4 w-4 mt-0.5 shrink-0 text-[#ff3b5c]" />
                  {d}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Us — middle, highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative card-glow p-7 lg:p-8 border-transparent lg:-my-6"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,255,159,0.14), rgba(34,211,238,0.06) 50%, rgba(0,0,0,0.1))",
              borderColor: "rgba(0,255,159,0.45)",
              boxShadow: "0 30px 100px -30px rgba(0,255,159,0.35)",
            }}
          >
            <div className="chip-pill mb-5" style={{ color: "#00ff9f", borderColor: "rgba(0,255,159,0.4)" }}>
              ★ Our differentiation
            </div>
            <h3 className="font-display text-3xl font-semibold mb-2 text-white">{US.name}</h3>
            <div className="text-[12px] text-[var(--fg-2)] mb-6 font-mono-ui">{US.example}</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">Target</div>
            <p className="text-[14px] text-white mb-6">{US.target}</p>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">What we deliver</div>
            <ul className="space-y-2.5">
              {US.wins.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-white">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#00ff9f]" />
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-[11px] text-[var(--fg-3)] mb-1">Core advantage</div>
              <p className="text-[14.5px] text-white leading-snug">
                <span className="text-gradient-green font-semibold">Professional-grade analysis</span>,{" "}
                <span className="text-gradient-pink font-semibold">beginner-friendly understanding.</span>
              </p>
            </div>
          </motion.div>

          {/* Mass market */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className={`card-glow p-7 lg:p-8 ${MASS.tone.border}`}
          >
            <div className={`chip-pill mb-5 ${MASS.tone.pill}`}>Consumer</div>
            <h3 className="font-display text-3xl font-semibold mb-2">{MASS.name}</h3>
            <div className="text-[12px] text-[var(--fg-3)] mb-6 font-mono-ui">{MASS.example}</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">Target</div>
            <p className="text-[14px] text-[var(--fg-1)] mb-6">{MASS.target}</p>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">Drawbacks</div>
            <ul className="space-y-2">
              {MASS.drawbacks.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-[13.5px] text-[var(--fg-2)]">
                  <X className="h-4 w-4 mt-0.5 shrink-0 text-[#ff3b5c]" />
                  {d}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
