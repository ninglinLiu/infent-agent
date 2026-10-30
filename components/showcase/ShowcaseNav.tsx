"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BRAND } from "@/lib/brand"
import { useLang, useT, type DictKey } from "@/lib/i18n"
import { ArrowRight, Github, Languages } from "lucide-react"
import { BackToStreet } from "@/components/academy/BackToStreet"

const LINKS: { href: string; key: DictKey }[] = [
  { href: "#problem",     key: "showcase.nav.problem" },
  { href: "#solution",    key: "showcase.nav.solution" },
  { href: "#landscape",   key: "showcase.nav.landscape" },
  { href: "#value",       key: "showcase.nav.value" },
  { href: "#brand",       key: "showcase.nav.brand" },
  { href: "#team",        key: "showcase.nav.team" },
]

export function ShowcaseNav() {
  const { lang, setLang } = useLang()
  const t = useT()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl bg-[rgba(10,12,14,0.65)] border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="sec-x h-14 flex items-center justify-between gap-4">
        <div className="street-header-brand">
        <BackToStreet />
        <Link href="/about" className="flex items-center gap-2 group shrink-0">
          <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-[#00ff9f] to-[#22d3ee] flex items-center justify-center">
            <span className="font-display text-[13px] font-bold text-black">Ω</span>
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display text-sm font-semibold tracking-wide">{BRAND.short}</span>
            <span className="text-[9px] text-[var(--fg-3)] uppercase tracking-[0.25em]">Omni · AI</span>
          </div>
        </Link>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[12.5px] text-[var(--fg-2)] hover:text-white transition link-underline"
            >
              {t(l.key)}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium border border-white/15 hover:border-white/40 hover:bg-white/5 transition"
            title={t("lang.label")}
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === "zh" ? "EN" : "中文"}
          </button>
          <a
            href={BRAND.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex chip-pill hover:border-white/30 transition"
          >
            <Github className="h-3.5 w-3.5" />
            {t("showcase.github")}
          </a>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold bg-white text-black hover:bg-[#00ff9f] transition"
          >
            {t("showcase.launch")}
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
