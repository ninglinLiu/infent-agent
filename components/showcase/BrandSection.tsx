"use client"

import { motion } from "framer-motion"
import { BadgeCheck, HeartHandshake, Rocket, Smartphone } from "lucide-react"
import { Orbs } from "./Orbs"

const SCULPTURE = [
  { label: "Positioning", text: "Lightweight financial assistant for ordinary investors" },
  { label: "Image", text: "Reliable, user-friendly, approachable professional" },
  { label: "Differentiation", text: "Companion-based · low psychological threshold" },
]

const XP = [
  { icon: Rocket, text: "Zero-threshold onboarding" },
  { icon: BadgeCheck, text: "Clear, jargon-free analysis output" },
  { icon: HeartHandshake, text: "One-click operation + intelligent Q&A" },
  { icon: Smartphone, text: "Mobile-compatible for fragmented use" },
]

const LOYALTY = [
  { k: "Value retention",      v: "AI iteration + investment insights" },
  { k: "Emotional connection", v: "Feedback response + exclusive benefits" },
  { k: "Trust building",       v: "Transparent logic + real user cases" },
]

export function BrandSection() {
  return (
    <section id="brand" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="hot" />
      <div className="relative z-10 sec-x">
        <div className="mb-16 max-w-[1200px]">
          <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
            <span className="text-[#ff6aa8]">05</span> · Branding & Customer Experience
          </span>
          <h2 className="display-xxl text-[clamp(44px,6vw,96px)]">
            Brand sculpted for <span className="text-gradient-pink">trust.</span>
            <br />
            Experience tuned for <span className="text-gradient-amber">speed.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sculpture — spans 5 cols */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="card-glow p-7 lg:p-9 lg:col-span-5"
          >
            <h3 className="font-display text-2xl font-semibold mb-6">Brand sculpture</h3>
            <ul className="space-y-5">
              {SCULPTURE.map((s) => (
                <li key={s.label}>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--fg-3)] mb-1">
                    {s.label}
                  </div>
                  <div className="text-[16px] text-white">{s.text}</div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Experience — 7 cols grid */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="lg:col-span-7 grid grid-cols-2 gap-4"
          >
            {XP.map((x, i) => {
              const Icon = x.icon
              const colors = ["#00ff9f", "#22d3ee", "#ff6aa8", "#ffb547"]
              const c = colors[i]
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-white/8 p-6 hover:border-white/25 transition"
                  style={{ background: `linear-gradient(180deg, ${c}0d, transparent 70%)` }}
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: `${c}22`, border: `1px solid ${c}44` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: c }} />
                  </div>
                  <div className="text-[11px] text-[var(--fg-3)] mb-1">Customer experience {(i + 1).toString().padStart(2, "0")}</div>
                  <div className="font-display text-lg font-semibold leading-tight">{x.text}</div>
                </div>
              )
            })}
          </motion.div>

          {/* Loyalty — full width */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="lg:col-span-12 rounded-[22px] border border-white/10 p-7 lg:p-9"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.03), transparent)" }}
          >
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <h3 className="font-display text-2xl md:text-3xl font-semibold">Customer loyalty loop</h3>
              <span className="text-[12px] text-[var(--fg-3)]">3 retention pillars</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {LOYALTY.map((l, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="display-xxl text-[clamp(36px,4vw,64px)] text-gradient-green leading-none">
                    0{i + 1}
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold">{l.k}</div>
                    <div className="text-[13.5px] text-[var(--fg-2)] mt-1 leading-relaxed">{l.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
