'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { HoloCard } from './HoloCard'
import { motion } from 'framer-motion'
import ProjectData from '@/content/project.json'
import { PretextEditorialColumn } from '@/components/pretext/PretextEditorialColumn'

export function ProblemSolution() {
  const { language } = useLanguage()
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')

  useEffect(() => {
    setProblem(ProjectData.problem[language])
    setSolution(ProjectData.solution[language])
  }, [language])

  return (
    <section className="relative py-24 container mx-auto px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[2%] top-0 hidden h-40 w-px bg-gradient-to-b from-fuchsia-500/40 to-transparent lg:block"
      />
      <h2 className="font-display text-4xl font-black text-center mb-4 md:text-5xl">
        <span className="bg-gradient-to-r from-fuchsia-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
          {language === 'zh' ? '痛点与解决方案' : 'Problem & Solution'}
        </span>
      </h2>
      <p className="mx-auto mb-14 max-w-2xl text-center font-mono text-[11px] uppercase tracking-[0.4em] text-zinc-500">
        {language === 'zh' ? 'Pretext · 逐行拆解 · 非 DOM 测量' : 'Pretext · line-native · no DOM measurement'}
      </p>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <HoloCard className="h-full" contentClassName="p-8 ring-1 ring-red-500/30">
            <h3 className="text-3xl font-bold neon-text-magenta mb-6">
              {language === 'zh' ? '💔 痛点' : '💔 Problem'}
            </h3>
            <PretextEditorialColumn
              text={problem}
              whiteSpace="pre-wrap"
              className="mt-2"
            />
          </HoloCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <HoloCard className="h-full" contentClassName="p-8 ring-1 ring-emerald-400/35">
            <h3 className="text-3xl font-bold" style={{ color: '#00ff88', textShadow: '0 0 10px currentColor, 0 0 20px currentColor' }}>
              {language === 'zh' ? '✨ 解决方案' : '✨ Solution'}
            </h3>
            <PretextEditorialColumn
              text={solution}
              whiteSpace="pre-wrap"
              className="mt-6"
            />
          </HoloCard>
        </motion.div>
      </div>
    </section>
  )
}
