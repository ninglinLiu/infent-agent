'use client'

import { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HoloCardProps {
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function HoloCard({
  children,
  className = '',
  contentClassName = 'p-6',
}: HoloCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <motion.div
      className={cn('group relative rounded-xl p-px', className)}
      onMouseMove={handleMouseMove}
      style={{
        transform: `perspective(1100px) rotateY(${mousePosition.x / 14}deg) rotateX(${-mousePosition.y / 14}deg)`,
      }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-xl opacity-80 blur-[0.5px]"
        style={{
          background:
            'conic-gradient(from 200deg at 50% 50%, rgba(34,211,238,0.45) 0deg, rgba(232,121,249,0.5) 110deg, rgba(167,139,250,0.45) 220deg, rgba(52,211,153,0.35) 300deg, rgba(34,211,238,0.45) 360deg)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      />
      <div
        className={cn(
          'relative z-10 flex min-h-0 flex-col rounded-[11px] border border-white/[0.07] bg-zinc-950/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(0,0,0,0.4)] backdrop-blur-md',
          contentClassName
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(520px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(34,211,238,0.14), transparent 58%)`,
          }}
        />
        <div className="relative z-10 flex h-full min-h-0 flex-col">{children}</div>
      </div>
    </motion.div>
  )
}
