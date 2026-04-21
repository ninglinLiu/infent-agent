import { BRAND } from "@/lib/brand"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 sec-x">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#00ff9f] to-[#22d3ee] flex items-center justify-center">
            <span className="font-display text-[13px] font-bold text-black">Ω</span>
          </div>
          <div className="text-[12px] text-[var(--fg-2)]">
            <div className="font-display font-semibold text-white">{BRAND.short}</div>
            <div className="text-[11px] text-[var(--fg-3)] max-w-[460px] leading-snug">
              {BRAND.full}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 text-[12px] text-[var(--fg-2)]">
          <a href={BRAND.repoUrl} target="_blank" rel="noreferrer" className="link-underline inline-flex items-center gap-1">
            <Github className="h-3.5 w-3.5" /> GitHub
          </a>
          <a href="/dashboard" className="link-underline">Console</a>
          <span className="text-[var(--fg-3)]">© 2025 {BRAND.team}</span>
        </div>
      </div>
    </footer>
  )
}
