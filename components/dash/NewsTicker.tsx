"use client"

import { NEWS_FEED } from "@/lib/mock/market"
import { useLang, useT } from "@/lib/i18n"
import { Newspaper, Radio } from "lucide-react"

export function NewsTicker() {
  const { lang } = useLang()
  const t = useT()
  return (
    <div className="surface h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Newspaper className="h-3.5 w-3.5 text-info" />
          <span className="text-[11px] uppercase tracking-wider text-dim">{t("news.title")}</span>
        </div>
        <span className="chip info">
          <Radio className="h-2.5 w-2.5 animate-pulse" /> {t("dash.live")}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll px-2 pb-2 space-y-1">
        {NEWS_FEED.map((n) => {
          const toneColor =
            n.sentiment === "up" ? "text-up" : n.sentiment === "down" ? "text-down" : "text-dim"
          const dot = n.sentiment === "up" ? "bg-up" : n.sentiment === "down" ? "bg-down" : "bg-[var(--fg-3)]"
          return (
            <div key={n.id} className="group px-2 py-1.5 rounded hover:bg-[var(--bg-3)] transition">
              <div className="flex items-center gap-2 text-[10px] text-ghost">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
                <span className="font-mono-ui">{n.time}</span>
                <span>·</span>
                <span>{n.src}</span>
                {n.tag && (
                  <span className="ml-auto chip text-[9px] px-1.5 py-0">
                    {lang === "en" ? n.tagEn ?? n.tag : n.tag}
                  </span>
                )}
              </div>
              <div className={`text-xs leading-snug mt-0.5 ${toneColor}`}>
                {lang === "en" ? n.titleEn : n.title}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
