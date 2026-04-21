'use client'

import { useEffect, useRef, useState } from 'react'
import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext'
import type { LayoutLine, PrepareOptions } from '@chenglou/pretext'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { bodyFont } from '@/lib/pretext-fonts'

type WhiteSpaceMode = NonNullable<PrepareOptions['whiteSpace']>

type PretextEditorialColumnProps = {
  text: string
  /** Match CSS: use pre-wrap when the copy contains intentional newlines */
  whiteSpace?: WhiteSpaceMode
  fontSizePx?: number
  fontWeight?: number
  className?: string
  lineClassName?: string
}

export function PretextEditorialColumn({
  text,
  whiteSpace = 'normal',
  fontSizePx = 17,
  fontWeight = 500,
  className,
  lineClassName,
}: PretextEditorialColumnProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<LayoutLine[]>([])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell || !text.trim()) {
      setLines([])
      return
    }

    const run = () => {
      const width = shell.clientWidth
      if (width < 24) return

      void document.fonts.ready.then(() => {
        const font = bodyFont(fontSizePx, fontWeight)
        const opts: PrepareOptions = {
          whiteSpace,
          wordBreak: /[\u4e00-\u9fff]/.test(text) ? 'keep-all' : 'normal',
        }
        const prepared = prepareWithSegments(text, font, opts)
        const lineHeight = Math.round(fontSizePx * 1.65)
        const { lines: next } = layoutWithLines(prepared, width, lineHeight)
        setLines(next)
      })
    }

    run()
    const ro = new ResizeObserver(run)
    ro.observe(shell)
    return () => ro.disconnect()
  }, [text, whiteSpace, fontSizePx, fontWeight])

  return (
    <div ref={shellRef} className={cn('min-h-[1.5em]', className)}>
      {lines.map((line, i) => (
        <motion.p
          key={`${i}-${line.start.segmentIndex}-${line.start.graphemeIndex}`}
          initial={{ opacity: 0, filter: 'blur(6px)', x: -8 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', x: (i % 3) * 5 - 5 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.45, delay: Math.min(i, 18) * 0.04, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'text-pretty text-zinc-300',
            i % 4 === 0 && 'border-l-2 border-cyan-400/35 pl-3',
            lineClassName
          )}
        >
          {line.text}
        </motion.p>
      ))}
    </div>
  )
}
