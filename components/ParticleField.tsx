'use client'

import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { cn } from '@/lib/utils'

export function ParticleField({ className }: { className?: string }) {
  const [ready, setReady] = useState(false)
  const [skip, setSkip] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setSkip(true)
      return
    }

    let cancelled = false

    void initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      if (!cancelled) setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const options = useMemo(
    () => ({
      background: {
        color: { value: 'transparent' },
      },
      fpsLimit: 90,
      fullScreen: { enable: false, zIndex: 0 },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'grab' as const },
        },
        modes: {
          grab: {
            distance: 150,
            links: { opacity: 0.4 },
          },
        },
      },
      particles: {
        color: { value: ['#22d3ee', '#e879f9', '#a78bfa', '#34d399'] },
        links: {
          color: '#22d3ee',
          distance: 120,
          enable: true,
          opacity: 0.14,
          width: 1,
        },
        move: {
          direction: 'none' as const,
          enable: true,
          outModes: { default: 'bounce' as const },
          random: true,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: { enable: true, width: 1920, height: 1080 },
          value: 58,
        },
        opacity: {
          value: { min: 0.12, max: 0.55 },
          animation: { enable: true, speed: 0.4, sync: false },
        },
        shape: { type: 'circle' },
        size: { value: { min: 0.6, max: 2.4 } },
      },
      detectRetina: true,
    }),
    []
  )

  if (skip || !ready) return null

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-[1] h-full w-full overflow-hidden',
        className
      )}
    >
      <Particles id="cyber-particles" className="h-full w-full" options={options} />
    </div>
  )
}
