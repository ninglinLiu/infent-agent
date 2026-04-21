"use client"

import { motion } from "framer-motion"
import { Orbs } from "./Orbs"

const TEAM = [
  {
    role: "Project Lead",
    name: "Junzhe Sun",
    id: "2472587",
    skills: "Oversees project direction, coordinates tasks, and ensures smooth delivery across teams.",
    accent: "#00ff9f",
  },
  {
    role: "Technical Lead",
    name: "Yu Liu · Jinhao Ren",
    id: "2468555 · 2470525",
    skills: "Designs the system architecture, builds AI/ML components, integrates APIs across the platform.",
    accent: "#22d3ee",
  },
  {
    role: "Research Analyst",
    name: "Ziyi Dong · Cheryl Valerie Wijaya",
    id: "2472901 · 2581229",
    skills: "Conducts qualitative and quantitative research. Analyzes data to identify key findings and trends.",
    accent: "#ff6aa8",
  },
  {
    role: "Research Analyst",
    name: "Mingyang Zhang · Zhengda Zhang",
    id: "2472389 · 2471040",
    skills: "Handles documentation and quality checks across all deliverables.",
    accent: "#ffb547",
  },
]

export function TeamSection() {
  return (
    <section id="team" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="cool" />
      <div className="relative z-10 sec-x">
        <div className="mb-16 max-w-[1200px]">
          <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
            <span className="text-[#22d3ee]">06</span> · Team · Neon Roles & Byte Skills
          </span>
          <h2 className="display-xxl text-[clamp(44px,6vw,96px)]">
            A decentralized ledger of{" "}
            <span className="text-gradient-wallet">cognition, accountability</span>
            <br />& creative wattage.
          </h2>
          <p className="mt-8 max-w-[680px] text-[15px] text-[var(--fg-2)] leading-relaxed">
            Group 3 · CITIC Securities Innovation Project 2025. A full-stack team covering product, engineering,
            and research — each milestone time-stamped on our immutable semester log.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="card-glow p-6 h-full flex flex-col"
              style={{ background: `linear-gradient(180deg, ${t.accent}0f, transparent 60%)` }}
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center mb-6 font-mono-ui text-[12px] font-bold"
                style={{ background: `${t.accent}22`, border: `1px solid ${t.accent}66`, color: t.accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--fg-3)] mb-1">
                {t.role}
              </div>
              <div className="font-display text-[18px] font-semibold leading-tight">{t.name}</div>
              <div className="text-[11px] text-[var(--fg-3)] mt-1 font-mono-ui">{t.id}</div>
              <div className="mt-5 text-[13px] text-[var(--fg-2)] leading-relaxed">{t.skills}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
