'use client'

import { motion, useReducedMotion } from 'framer-motion'

export function HeroSparkles() {
  const reduce = useReducedMotion()

  if (reduce) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-cyan-200/90 shadow-[0_0_14px_#22d3ee]"
          style={{
            left: `${((i * 37) % 92) + 4}%`,
            top: `${((i * 53) % 80) + 8}%`,
          }}
          animate={{ opacity: [0.15, 1, 0.15], scale: [0.7, 1.35, 0.7] }}
          transition={{
            duration: 2.2 + (i % 4) * 0.35,
            repeat: Infinity,
            delay: i * 0.07,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
