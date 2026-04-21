"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect } from "react"
import { useDash } from "@/lib/dash-store"
import { useLang } from "@/lib/i18n"
import { CheckCircle2, Info, TrendingDown } from "lucide-react"

export function ToastLayer() {
  const { toast, clearToast } = useDash()
  const { lang } = useLang()
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 2400)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  const Icon = !toast
    ? CheckCircle2
    : toast.tone === "up"
      ? CheckCircle2
      : toast.tone === "down"
        ? TrendingDown
        : Info

  const tone = toast?.tone ?? "info"
  const toneClass =
    tone === "up"
      ? "ring-up bg-[rgba(0,255,159,0.08)] text-up"
      : tone === "down"
        ? "ring-down bg-[rgba(255,59,92,0.08)] text-down"
        : "ring-info bg-[rgba(88,199,255,0.08)] text-info"

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className={`pointer-events-auto min-w-[240px] max-w-[360px] surface-raised px-3 py-2.5 flex items-start gap-2 ${toneClass}`}
          >
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="text-[12px] leading-snug text-[var(--fg-0)]">{toast.text[lang]}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
