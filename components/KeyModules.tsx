'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { HoloCard } from './HoloCard'
import { motion } from 'framer-motion'
import ProjectData from '@/content/project.json'

export function KeyModules() {
  const { language } = useLanguage()
  const [modules, setModules] = useState<any[]>([])

  useEffect(() => {
    setModules(ProjectData.modules[language])
  }, [language])

  return (
    <section id="features" className="relative py-24 container mx-auto px-4">
      <h2 className="font-display text-4xl font-black text-center mb-3 md:text-5xl">
        <span className="bg-gradient-to-r from-cyan-200 via-teal-200 to-emerald-200 bg-clip-text text-transparent">
          {language === 'zh' ? '核心模块' : 'Key Modules'}
        </span>
      </h2>
      <p className="font-mono text-center text-[10px] uppercase tracking-[0.45em] text-zinc-500 mb-14">
        {language === 'zh' ? '系统化能力矩阵' : 'Capability lattice'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <motion.div
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <HoloCard className="h-full" contentClassName="flex h-full flex-col p-6">
              <h3 className="text-xl font-bold neon-text-cyan mb-3">{module.title}</h3>
              <p className="text-gray-300 flex-grow">{module.description}</p>
            </HoloCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
