"use client"

import { motion } from "framer-motion"
import { Orbs } from "./Orbs"
import { useLang } from "@/lib/i18n"
import { useShowcaseCopy } from "@/lib/showcase-copy"

const TEAM_META = [
  { name: "Junzhe Sun", id: "2472587", accent: "#00ff9f" },
  { name: "Yu Liu · Jinhao Ren", id: "2468555 · 2470525", accent: "#22d3ee" },
  { name: "Ziyi Dong · Cheryl Valerie Wijaya", id: "2472901 · 2581229", accent: "#ff6aa8" },
  { name: "Yiren.Qian", id: "2769718", accent: "#ffb547" },
]

export function TeamSection() {
  const { lang } = useLang()
  const c = useShowcaseCopy()
  const zh = lang === "zh"

  return (
    <section id="team" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="cool" />
      <div className="relative z-10 sec-x">
        <div className="mb-16 max-w-[1200px]">
          <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
            <span className="text-[#22d3ee]">06</span> · {c.team.kicker}
          </span>
          <h2 className={`display-xxl text-[clamp(44px,6vw,96px)] ${zh ? "break-keep" : ""}`}>
            {c.team.titleBefore}
            {zh ? "" : " "}
            <span className="text-gradient-wallet">{c.team.titleHighlight}</span>
            <br />
            {c.team.titleAfter}
          </h2>
          <p className="mt-8 max-w-[680px] text-[15px] text-[var(--fg-2)] leading-relaxed">{c.team.lead}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM_META.map((meta, i) => (
            <motion.div
              key={`${lang}-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="card-glow p-6 h-full flex flex-col"
              style={{ background: `linear-gradient(180deg, ${meta.accent}0f, transparent 60%)` }}
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center mb-6 font-mono-ui text-[12px] font-bold"
                style={{ background: `${meta.accent}22`, border: `1px solid ${meta.accent}66`, color: meta.accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--fg-3)] mb-1">
                {c.team.members[i].role}
              </div>
              <div className="font-display text-[18px] font-semibold leading-tight">{meta.name}</div>
              <div className="text-[11px] text-[var(--fg-3)] mt-1 font-mono-ui">{meta.id}</div>
              <div className="mt-5 text-[13px] text-[var(--fg-2)] leading-relaxed">{c.team.members[i].skills}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
