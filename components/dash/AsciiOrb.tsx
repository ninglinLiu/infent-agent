"use client"

import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useLang } from '@/lib/i18n'

// Original character-field animation: no remote scripts or animation runtime.
function frame(time: number) {
  const cols = 65, rows = 27, shades = ' .·:+*oO@'
  const lines: string[] = []
  for (let y = 0; y < rows; y++) {
    let line = ''
    for (let x = 0; x < cols; x++) {
      const dx = (x - cols / 2) / 27, dy = (y - rows / 2) / 12
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > 1) { line += ' '; continue }
      const depth = Math.sqrt(1 - distance * distance)
      const angle = Math.atan2(dy, dx)
      const wave = Math.sin(angle * 3 + depth * 9 - time * .8) * .5 + .5
      const light = (.28 + depth * .5 + wave * .32) * Math.min(1, (1 - distance) * 10)
      line += shades[Math.min(shades.length - 1, Math.floor(light * shades.length))]
    }
    lines.push(line)
  }
  return lines.join('\n')
}

export function AsciiOrb() {
  const { lang } = useLang()
  const host = useRef<HTMLDivElement>(null)
  const art = useRef<HTMLPreElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false, timer = 0, elapsed = 0
    const stop = () => { window.clearInterval(timer); timer = 0 }
    const sync = () => {
      stop()
      if (!visible || paused || media.matches || document.hidden) return
      timer = window.setInterval(() => {
        elapsed += 1 / 12
        if (art.current) art.current.textContent = frame(elapsed)
      }, 1000 / 12)
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync() })
    if (host.current) observer.observe(host.current)
    media.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    return () => { stop(); observer.disconnect(); media.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync) }
  }, [paused])

  return <div className="ascii-orb" ref={host}>
    <pre ref={art} aria-hidden="true">{frame(0)}</pre>
    <span className="ascii-orb-label" aria-hidden="true">omni / intelligence</span>
    <button type="button" onClick={() => setPaused(value => !value)} aria-label={lang === 'en' ? paused ? 'Play character animation' : 'Pause character animation' : paused ? '播放字符动画' : '暂停字符动画'} aria-pressed={paused}>{paused ? <Play size={12} /> : <Pause size={12} />}</button>
  </div>
}
