"use client"

import { motion } from "framer-motion"
import { BadgeCheck, HeartHandshake, Rocket, Smartphone } from "lucide-react"
import { Orbs } from "./Orbs"
import { useLang } from "@/lib/i18n"
import { useShowcaseCopy } from "@/lib/showcase-copy"

const XP_ICONS = [Rocket, BadgeCheck, HeartHandshake, Smartphone]

export function BrandSection() {
  const { lang } = useLang()
  const c = useShowcaseCopy()
  const zh = lang === "zh"

  return (
    <section id="brand" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="hot" />
      <div className="relative z-10 sec-x">
        <div className="mb-16 max-w-[1200px]">
          <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
            <span className="text-[#ff6aa8]">05</span> · {c.brand.kicker}
          </span>
          <h2 className={`display-xxl text-[clamp(44px,6vw,96px)] ${zh ? "break-keep" : ""}`}>
            {c.brand.titleBefore}
            {zh ? "" : " "}
            <span className="text-gradient-pink">{c.brand.titleTrust}</span>
            {zh ? "。" : ""}
            <br />
            {c.brand.titleMid}
            {zh ? "" : " "}
            <span className="text-gradient-amber">{c.brand.titleSpeed}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="card-glow p-7 lg:p-9 lg:col-span-5"
          >
            <h3 className="font-display text-2xl font-semibold mb-6">{c.brand.sculptureTitle}</h3>
            <ul className="space-y-5">
              {c.brand.sculpture.map((s) => (
                <li key={`${lang}-${s.label}`}>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--fg-3)] mb-1">{s.label}</div>
                  <div className="text-[16px] text-white">{s.text}</div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="lg:col-span-7 grid grid-cols-2 gap-4"
          >
            {c.brand.xp.map((text, i) => {
              const Icon = XP_ICONS[i]
              const colors = ["#00ff9f", "#22d3ee", "#ff6aa8", "#ffb547"]
              const color = colors[i]
              return (
                <div
                  key={`${lang}-${i}`}
                  className="rounded-2xl border border-white/8 p-6 hover:border-white/25 transition"
                  style={{ background: `linear-gradient(180deg, ${color}0d, transparent 70%)` }}
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: `${color}22`, border: `1px solid ${color}44` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="text-[11px] text-[var(--fg-3)] mb-1">
                    {c.brand.xpLabel} {(i + 1).toString().padStart(2, "0")}
                  </div>
                  <div className="font-display text-lg font-semibold leading-tight">{text}</div>
                </div>
              )
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="lg:col-span-12 rounded-[22px] border border-white/10 p-7 lg:p-9"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.03), transparent)" }}
          >
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <h3 className="font-display text-2xl md:text-3xl font-semibold">{c.brand.loopTitle}</h3>
              <span className="text-[12px] text-[var(--fg-3)]">{c.brand.loopSub}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {c.brand.loyalty.map((item, i) => (
                <div key={`${lang}-${i}`} className="flex items-start gap-4">
                  <div className="display-xxl text-[clamp(36px,4vw,64px)] text-gradient-green leading-none">0{i + 1}</div>
                  <div>
                    <div className="font-display text-lg font-semibold">{item.k}</div>
                    <div className="text-[13.5px] text-[var(--fg-2)] mt-1 leading-relaxed">{item.v}</div>
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
