'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LanguageSwitch } from './LanguageSwitch'

export function NeonHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-black/35 backdrop-blur-xl">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
        initial={{ opacity: 0.4, scaleX: 0.85 }}
        animate={{ opacity: [0.35, 0.9, 0.35], scaleX: [0.85, 1, 0.85] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="container mx-auto flex items-center justify-between px-4 py-3.5 md:py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-display text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(34,211,238,0.35)]">
              AI
            </span>
            <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(232,121,249,0.3)]">
              Pro
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-zinc-300 transition-colors hover:text-cyan-300"
          >
            Features
          </Link>
          <Link
            href="#ai-consultant"
            className="text-sm font-medium text-zinc-300 transition-colors hover:text-fuchsia-300"
          >
            AI Advisor
          </Link>
          <Link
            href="#metrics"
            className="text-sm font-medium text-zinc-300 transition-colors hover:text-violet-300"
          >
            Metrics
          </Link>
          <Link
            href="#contact"
            className="text-sm font-medium text-zinc-300 transition-colors hover:text-emerald-300"
          >
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
        </div>
      </div>
    </header>
  )
}
