"use client"

import { useEffect } from 'react'
import { useAcademy } from './AcademyProvider'

/** Small pointer attraction for primary actions; never affects touch or reduced motion. */
export function ExperienceMotion() {
  const { state } = useAcademy()
  useEffect(() => {
    if (state.presentation !== 'immersive' || state.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return
    let current: HTMLElement | null = null
    const clear = () => { current?.style.removeProperty('--mag-x'); current?.style.removeProperty('--mag-y'); current = null }
    const move = (event: PointerEvent) => {
      const button = (event.target as Element)?.closest<HTMLElement>('.academy-root .academy-primary')
      if (button !== current) clear()
      if (!button) return
      current = button
      const rect = button.getBoundingClientRect()
      button.style.setProperty('--mag-x', `${(event.clientX - rect.left - rect.width / 2) * .035}px`)
      button.style.setProperty('--mag-y', `${(event.clientY - rect.top - rect.height / 2) * .09}px`)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', clear)
    return () => { clear(); document.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', clear) }
  }, [state.presentation, state.reducedMotion])
  return null
}
