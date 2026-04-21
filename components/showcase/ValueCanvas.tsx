"use client"

import { motion } from "framer-motion"
import { Coins, Goal, ScanLine, Sparkles, Target, Users } from "lucide-react"
import { Orbs } from "./Orbs"

const AUDIENCE = [
  "Non-professionals & ordinary investors",
  "Want to invest but lack financial knowledge",
  "Need an accessible on-ramp to the market",
]
const PAIN_SOLVED = [
  "Lack professional financial knowledge",
  "Rely on intuition, prone to mistakes",
  "No user-friendly tools balancing pro & UX",
]
const VALUE = [
  "Simplify financial jargon & complex outputs",
  "AI-driven objective analysis",
  "Lightweight design, lower barriers",
]

export function ValueCanvas() {
  return (
    <section id="value" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="default" />
      <div className="relative z-10 sec-x">
        <div className="mb-16 max-w-[1200px]">
          <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
            <span className="text-[#ffb547]">04</span> · Value Proposition Canvas
          </span>
          <h2 className="display-xxl text-[clamp(44px,6vw,96px)]">
            Built for a specific person.{" "}
            <span className="text-gradient-green">Not everyone.</span>
          </h2>
          <p className="mt-6 max-w-[620px] text-[15.5px] text-[var(--fg-2)] leading-relaxed">
            We designed the canvas backwards — starting from an imagined user (a 28-year-old salaried
            professional with ¥100K savings and zero experience) — and working back to features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left column — audience & pain */}
          <div className="space-y-5">
            <Pane icon={Users} title="Target audience" color="#22d3ee" items={AUDIENCE} />
            <Pane icon={ScanLine} title="Pain points solved" color="#ff6aa8" items={PAIN_SOLVED} />
          </div>

          {/* Right column — unique value + differentiator */}
          <div className="space-y-5">
            <Pane icon={Sparkles} title="Unique value delivered" color="#00ff9f" items={VALUE} />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55 }}
              className="rounded-[22px] p-7 lg:p-9 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,255,159,0.14), rgba(34,211,238,0.08) 50%, rgba(255,106,168,0.1))",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Goal className="h-4 w-4 text-[#00ff9f]" />
                <span className="chip-pill text-[11px]">Key differentiator</span>
              </div>
              <h3 className="font-display text-[26px] md:text-[34px] leading-[1.05] font-semibold">
                Balance <span className="text-gradient-green">professional analysis</span> and{" "}
                <span className="text-gradient-pink">user-friendliness</span> — unlike complex pro tools or
                superficial consumer apps.
              </h3>
              <p className="mt-5 text-[13.5px] text-[var(--fg-2)] leading-relaxed max-w-[520px]">
                We fill the market gap between $24K/yr terminals and single-tap robo-advisors. A companion,
                not a dashboard.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Pane({
  icon: Icon,
  title,
  color,
  items,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  title: string
  color: string
  items: string[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55 }}
      className="card-glow p-7 lg:p-8"
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}22`, border: `1px solid ${color}44` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <h3 className="font-display text-xl font-semibold">{title}</h3>
      </div>
      <ul className="space-y-3">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-3 text-[14.5px] text-[var(--fg-1)]">
            <span
              className="mt-2 h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: color }}
            />
            {t}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
