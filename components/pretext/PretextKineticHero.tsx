'use client'

import { useEffect, useRef, useState } from 'react'
import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext'
import type { PrepareOptions } from '@chenglou/pretext'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { motion } from 'framer-motion'
import { HeroSparkles } from '@/components/HeroSparkles'
import ProjectData from '@/content/project.json'
import { displayFont } from '@/lib/pretext-fonts'

type Pack = {
  result: ReturnType<typeof layoutWithLines>
  fontSize: number
  lineHeight: number
}

export function PretextKineticHero() {
  const { language } = useLanguage()
  const title = ProjectData.projectTitle[language]
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.35 })
  const [layoutW, setLayoutW] = useState(0)
  const [inView, setInView] = useState(true)
  const [pack, setPack] = useState<Pack | null>(null)
  const [canvasHeight, setCanvasHeight] = useState(280)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setLayoutW(Math.floor(entries[0].contentRect.width))
    })
    ro.observe(el)
    setLayoutW(Math.floor(el.clientWidth))
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (layoutW < 48 || !title) return

    void document.fonts.ready.then(() => {
      const fontSize = Math.round(Math.min(92, Math.max(34, layoutW * 0.078)))
      const lineHeight = Math.round(fontSize * 1.06)
      const opts: PrepareOptions =
        language === 'zh' ? { wordBreak: 'keep-all' } : { wordBreak: 'normal' }
      const prepared = prepareWithSegments(title, displayFont(fontSize), opts)
      const maxW = Math.max(140, layoutW - 32)
      const result = layoutWithLines(prepared, maxW, lineHeight)
      setPack({ result, fontSize, lineHeight })
      setCanvasHeight(Math.max(result.height + 56, 160))
    })
  }, [layoutW, title, language])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const obs = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), {
      threshold: 0.06,
    })
    obs.observe(root)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !pack) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
    const cssW = layoutW
    const cssH = canvasHeight
    canvas.width = Math.max(1, Math.floor(cssW * dpr))
    canvas.height = Math.max(1, Math.floor(cssH * dpr))
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const { result, fontSize, lineHeight } = pack
    const padL = 4
    let raf = 0
    const start = performance.now()

    const drawFrame = (now: number) => {
      const t = reduce ? 0 : now - start
      ctx.clearRect(0, 0, cssW, cssH)
      ctx.font = displayFont(fontSize)
      ctx.textBaseline = 'top'

      let y = 10
      const { lines } = result
      const { x: mx } = mouseRef.current

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const stagger = (i % 2) * 14 + (i % 4) * 3
        const wave = reduce ? 0 : Math.sin(t * 0.0016 + i * 0.42) * 3.2
        const breathe = reduce ? 1 : 0.96 + Math.sin(t * 0.0009 + i) * 0.04
        const x0 = padL + stagger + wave

        const skew = reduce ? 0 : Math.sin(t * 0.0007 + i * 0.2) * 0.018
        ctx.save()
        ctx.translate(x0, y)
        ctx.transform(1, skew, 0, breathe, 0, 0)

        const gx0 = mx * 80
        const gx1 = line.width + mx * 120
        const grad = ctx.createLinearGradient(gx0, 0, gx1, fontSize)
        grad.addColorStop(0, '#a5f3fc')
        grad.addColorStop(0.45, '#f0abfc')
        grad.addColorStop(1, '#c4b5fd')

        if (!reduce) {
          ctx.globalAlpha = 0.55
          ctx.fillStyle = '#06b6d4'
          ctx.fillText(line.text, -2.2, 0)
          ctx.fillStyle = '#d946ef'
          ctx.fillText(line.text, 2.4, 0.6)
          ctx.globalAlpha = 1
        }

        ctx.fillStyle = grad
        ctx.fillText(line.text, 0, 0)
        ctx.restore()

        y += lineHeight
      }

      if (!reduce && inView) raf = requestAnimationFrame(drawFrame)
    }

    drawFrame(performance.now())

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [pack, layoutW, canvasHeight, inView])

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[min(92svh,960px)] flex-col justify-between gap-10 overflow-hidden pb-16 pt-24 md:pt-28"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mouseRef.current = {
          x: (e.clientX - r.left) / Math.max(1, r.width),
          y: (e.clientY - r.top) / Math.max(1, r.height),
        }
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_15%_-10%,rgba(34,211,238,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_10%,rgba(232,121,249,0.11),transparent_50%)]" />
      <HeroSparkles />

      <h1 className="sr-only">{title}</h1>

      <div className="relative z-10 w-full">
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none mx-auto block max-w-full"
        />
      </div>

      <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/[0.08] px-4 py-1.5 text-sm text-fuchsia-100/95 shadow-[0_0_28px_rgba(232,121,249,0.18)] backdrop-blur-md"
        >
          <Sparkles className="h-4 w-4 text-fuchsia-300" aria-hidden />
          <span className="font-display font-semibold tracking-wide">
            {language === 'zh'
              ? 'Pretext 驱动的排版引擎 · 零 DOM 强制回流'
              : 'Pretext layout engine · zero layout thrashing'}
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mx-auto mb-10 text-balance text-lg leading-relaxed text-zinc-400 md:text-xl"
        >
          {language === 'zh'
            ? '融合机器学习与图神经网络的智能投资顾问与实时风险管理系统'
            : 'Intelligent investment advisor and real-time risk management system powered by ML and GNN'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.14 }}
        >
          <Button
            variant="neon"
            size="lg"
            className="group font-display shadow-[0_0_48px_rgba(236,72,153,0.22)]"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {language === 'zh' ? '探索功能' : 'Explore Features'}
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-8 left-4 select-none font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-500/40 md:left-8"
      >
        pretex∕t · canvas∕∕layout
      </div>
    </section>
  )
}
