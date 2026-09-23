"use client"

import Link from "next/link"
import { ArrowRight, Github } from "lucide-react"
import { BRAND } from "@/lib/brand"
import { Orbs } from "./Orbs"
import { useLang } from "@/lib/i18n"
import { useShowcaseCopy } from "@/lib/showcase-copy"

export function CTASection() {
  const { lang } = useLang()
  const c = useShowcaseCopy()
  const zh = lang === "zh"

  return (
    <section className="relative overflow-hidden pt-24 pb-32">
      <Orbs variant="default" />
      <div className="relative z-10 sec-x">
        <div
          className="relative rounded-[32px] border border-white/12 overflow-hidden p-10 sm:p-16 lg:p-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0,255,159,0.22), transparent 60%), radial-gradient(ellipse 60% 80% at 80% 100%, rgba(255,106,168,0.18), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
          }}
        >
          <div className="dotted-ring absolute inset-0 opacity-[0.06]" />
          <div className="relative z-10 max-w-[1100px]">
            <span className="chip-pill mb-6 text-[11px]">{c.cta.kicker}</span>
            <h2 className={`display-xxl text-[clamp(44px,7.5vw,128px)] ${zh ? "break-keep" : ""}`}>
              <span className="text-gradient-green">{c.cta.titleLaunch}</span>
              {zh ? "" : " "}
              {c.cta.titleRest}
            </h2>
            <p className="mt-8 max-w-[640px] text-[16px] sm:text-[18px] text-[var(--fg-1)] leading-relaxed">
              {c.cta.lead}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold bg-white text-black hover:bg-[#00ff9f] transition"
              >
                {c.cta.open}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </Link>
              <a
                href={BRAND.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold border border-white/15 hover:border-white/40 hover:bg-white/5 transition"
              >
                <Github className="h-4 w-4" />
                {c.cta.source}
              </a>
              <div className="ml-2 text-[12px] text-[var(--fg-3)]">
                {c.common.team} · {c.cta.report}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
