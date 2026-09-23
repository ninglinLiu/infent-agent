"use client"

import { motion } from "framer-motion"
import { AlertTriangle, BookOpen, BrainCircuit } from "lucide-react"
import { Orbs } from "./Orbs"
import { useLang } from "@/lib/i18n"
import { useShowcaseCopy } from "@/lib/showcase-copy"

const ICONS = [BookOpen, BrainCircuit, AlertTriangle]
const ACCENTS = ["from-[#00ff9f] to-[#22d3ee]", "from-[#ff6aa8] to-[#8b5cf6]", "from-[#ffb547] to-[#ff4fd8]"]

export function ProblemSection() {
  const { lang } = useLang()
  const c = useShowcaseCopy()
  const zh = lang === "zh"

  return (
    <section id="problem" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="cool" />
      <div className="relative z-10 sec-x">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
          <div>
            <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
              <span className="text-[#22d3ee]">01</span> · {c.problem.kicker}
            </span>
            <h2 className={`display-xxl text-[clamp(44px,6vw,96px)] max-w-[900px] ${zh ? "break-keep" : ""}`}>
              {c.problem.titleBefore}
              {zh ? "" : " "}
              <span className="text-gradient-pink">{c.problem.titleHighlight}</span>
              {zh ? "" : " "}
              {c.problem.titleAfter}
            </h2>
          </div>
          <p className="max-w-[460px] text-[15px] text-[var(--fg-2)] leading-relaxed">{c.problem.lead}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {c.problem.cards.map((p, i) => {
            const Icon = ICONS[i]
            return (
              <motion.div
                key={`${lang}-${p.title}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="card-glow p-7 md:p-8 flex flex-col justify-between min-h-[340px]"
              >
                <div>
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${ACCENTS[i]} flex items-center justify-center mb-6`}
                  >
                    <Icon className="h-5 w-5 text-black" />
                  </div>
                  <div className="text-[11px] text-[var(--fg-3)] uppercase tracking-[0.2em] mb-2">{p.tag}</div>
                  <h3 className="font-display text-3xl md:text-4xl font-semibold mb-4">{p.title}</h3>
                  <p className="text-[14.5px] text-[var(--fg-1)] leading-relaxed">{p.body}</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[11px] text-[var(--fg-3)]">
                  <span className="font-mono-ui">0{i + 1}</span>
                  <div className="flex-1 h-px bg-white/10" />
                  <span>{c.problem.painLabel}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
