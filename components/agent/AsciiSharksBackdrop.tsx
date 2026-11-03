'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import type { AgentOcean } from './ascii-sharks/ocean'
import styles from './AsciiSharksBackdrop.module.css'

export function AsciiSharksBackdrop({ subdued }: { subdued: boolean }) {
  const { lang } = useLang()
  const canvas = useRef<HTMLCanvasElement>(null)
  const ocean = useRef<AgentOcean | null>(null)
  const [paused, setPaused] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let disposed = false
    // Lazy load the decorative engine; chat never waits for this chunk.
    void import('./ascii-sharks/ocean').then(({ AgentOcean }) => {
      if (disposed || !canvas.current) return
      ocean.current = new AgentOcean(canvas.current)
      setReady(true)
    }).catch(() => { /* Canvas/chunk unavailable: retain the normal chat background. */ })
    return () => { disposed = true; ocean.current?.destroy(); ocean.current = null }
  }, [])

  return <>
    <div className={styles.backdrop} data-subdued={subdued} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} data-sharks-ready={ready} />
    </div>
    {ready && <button type="button" className={styles.toggle} aria-pressed={paused}
      aria-label={lang === 'en' ? paused ? 'Play shark animation' : 'Pause shark animation' : paused ? '播放鲨鱼动画' : '暂停鲨鱼动画'}
      onClick={() => { ocean.current?.setPaused(!paused); setPaused(!paused) }}>
      {paused ? <Play size={12} /> : <Pause size={12} />}
      <span>{lang === 'en' ? 'Ocean' : '鲨鱼背景'}</span>
    </button>}
  </>
}
