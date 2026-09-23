"use client"

import { motion } from "framer-motion"
import { Goal, ScanLine, Sparkles, Users } from "lucide-react"
import { Orbs } from "./Orbs"
import { useLang } from "@/lib/i18n"
import { useShowcaseCopy } from "@/lib/showcase-copy"

export function ValueCanvas() {
  const { lang } = useLang()
  const c = useShowcaseCopy()
  const zh = lang === "zh"

  return (
    <section id="value" className="relative overflow-hidden py-32 sm:py-44">
      <Orbs variant="default" />
      <div className="relative z-10 sec-x">
        <div className="mb-16 max-w-[1200px]">
          <span className="chip-pill mb-6 text-[11px] text-[var(--fg-2)]">
            <span className="text-[#ffb547]">04</span> · {c.value.kicker}
          </span>
          <h2 className={`display-xxl text-[clamp(44px,6vw,96px)] ${zh ? "break-keep" : ""}`}>
            {c.value.titleBefore}
            {zh ? "" : " "}
            <span className="text-gradient-green">{c.value.titleHighlight}</span>
          </h2>
          <p className="mt-6 max-w-[620px] text-[15.5px] text-[var(--fg-2)] leading-relaxed">{c.value.lead}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-5">
            <Pane icon={Users} title={c.value.audienceTitle} color="#22d3ee" items={c.value.audience} />
            <Pane icon={ScanLine} title={c.value.painTitle} color="#ff6aa8" items={c.value.pains} />
          </div>

          <div className="space-y-5">
            <Pane icon={Sparkles} title={c.value.uniqueTitle} color="#00ff9f" items={c.value.unique} />
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
                <span className="chip-pill text-[11px]">{c.value.diffKicker}</span>
              </div>
              <h3 className="font-display text-[26px] md:text-[34px] leading-[1.05] font-semibold">
                {c.value.diffBefore} <span className="text-gradient-green">{c.value.diffPro}</span> {c.value.diffMid}{" "}
                <span className="text-gradient-pink">{c.value.diffFriendly}</span> {c.value.diffAfter}
              </h3>
              <p className="mt-5 text-[13.5px] text-[var(--fg-2)] leading-relaxed max-w-[520px]">{c.value.diffLead}</p>
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
          <li key={`${title}-${i}`} className="flex items-start gap-3 text-[14.5px] text-[var(--fg-1)]">
            <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
            {t}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
