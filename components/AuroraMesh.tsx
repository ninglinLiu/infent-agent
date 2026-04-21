'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AuroraMesh({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-[2] overflow-hidden mix-blend-screen',
        className
      )}
    >
      <motion.div
        className="absolute -top-[20%] left-[5%] h-[55vmin] w-[55vmin] rounded-full bg-cyan-400/[0.14] blur-[90px]"
        animate={{ x: [0, 40, -10, 0], y: [0, 25, -15, 0], scale: [1, 1.05, 0.98, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[10%] right-[-10%] h-[60vmin] w-[60vmin] rounded-full bg-fuchsia-500/[0.12] blur-[100px]"
        animate={{ x: [0, -35, 15, 0], y: [0, 30, 10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-25%] left-[20%] h-[65vmin] w-[65vmin] rounded-full bg-violet-500/[0.12] blur-[110px]"
        animate={{ x: [0, 20, -25, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[5%] right-[15%] h-[40vmin] w-[40vmin] rounded-full bg-emerald-400/[0.09] blur-[80px]"
        animate={{ opacity: [0.5, 0.9, 0.6], scale: [1, 1.08, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
