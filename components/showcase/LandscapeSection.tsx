"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { Orbs } from "./Orbs"
import { useLang } from "@/lib/i18n"
import { useShowcaseCopy } from "@/lib/showcase-copy"

export function LandscapeSection() {
  const { lang } = useLang()
  const c = useShowcaseCopy()
  const zh = lang === "zh"

  return (
    <section id="landscape" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="soft" />
      <div className="relative z-10 sec-x">
        <div className="mb-16 max-w-[1200px]">
          <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
            <span className="text-[#8b5cf6]">03</span> · {c.landscape.kicker}
          </span>
          <h2 className={`display-xxl text-[clamp(44px,6vw,96px)] ${zh ? "break-keep" : ""}`}>
            {c.landscape.titleBefore}
            {zh ? "" : " "}
            <span className="text-gradient-pink">{c.landscape.titlePolar}</span>
            <br />
            {c.landscape.titleMid}
            {zh ? "" : " "}
            <span className="text-gradient-green">{c.landscape.titleMiddle}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="card-glow p-7 lg:p-8 border-white/10"
          >
            <div className="chip-pill mb-5 text-[var(--fg-3)]">{c.landscape.proPill}</div>
            <h3 className="font-display text-3xl font-semibold mb-2">{c.landscape.pro.name}</h3>
            <div className="text-[12px] text-[var(--fg-3)] mb-6 font-mono-ui">{c.landscape.pro.example}</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">{c.landscape.target}</div>
            <p className="text-[14px] text-[var(--fg-1)] mb-6">{c.landscape.pro.target}</p>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">{c.landscape.drawbacks}</div>
            <ul className="space-y-2">
              {c.landscape.pro.items.map((d, i) => (
                <li key={`${lang}-pro-${i}`} className="flex items-start gap-2 text-[13.5px] text-[var(--fg-2)]">
                  <X className="h-4 w-4 mt-0.5 shrink-0 text-[#ff3b5c]" />
                  {d}
                </li>
              ))}
            </ul>
          </motion.div>

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
              {c.landscape.usPill}
            </div>
            <h3 className="font-display text-3xl font-semibold mb-2 text-white">{c.landscape.us.name}</h3>
            <div className="text-[12px] text-[var(--fg-2)] mb-6 font-mono-ui">{c.landscape.us.example}</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">{c.landscape.target}</div>
            <p className="text-[14px] text-white mb-6">{c.landscape.us.target}</p>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">{c.landscape.deliver}</div>
            <ul className="space-y-2.5">
              {c.landscape.us.items.map((d, i) => (
                <li key={`${lang}-us-${i}`} className="flex items-start gap-2 text-[14px] text-white">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#00ff9f]" />
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-[11px] text-[var(--fg-3)] mb-1">{c.landscape.core}</div>
              <p className="text-[14.5px] text-white leading-snug">
                <span className="text-gradient-green font-semibold">{c.landscape.coreBefore}</span>
                {zh ? "，" : ", "}
                <span className="text-gradient-pink font-semibold">{c.landscape.coreAfter}</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="card-glow p-7 lg:p-8 border-white/10"
          >
            <div className="chip-pill mb-5 text-[var(--fg-3)]">{c.landscape.consumerPill}</div>
            <h3 className="font-display text-3xl font-semibold mb-2">{c.landscape.mass.name}</h3>
            <div className="text-[12px] text-[var(--fg-3)] mb-6 font-mono-ui">{c.landscape.mass.example}</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">{c.landscape.target}</div>
            <p className="text-[14px] text-[var(--fg-1)] mb-6">{c.landscape.mass.target}</p>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fg-3)] mb-3">{c.landscape.drawbacks}</div>
            <ul className="space-y-2">
              {c.landscape.mass.items.map((d, i) => (
                <li key={`${lang}-mass-${i}`} className="flex items-start gap-2 text-[13.5px] text-[var(--fg-2)]">
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
