'use client'

import { Hero } from '@/components/Hero'
import { ProblemSolution } from '@/components/ProblemSolution'
import { KeyModules } from '@/components/KeyModules'
import { MetricsPanel } from '@/components/MetricsPanel'
import { UseCases } from '@/components/UseCases'
import { TimelineRoadmap } from '@/components/TimelineRoadmap'
import { FAQ } from '@/components/FAQ'
import { ContactForm } from '@/components/ContactForm'
import { FooterCRT } from '@/components/FooterCRT'
import { AIConsultant } from '@/components/AIConsultant'
import { useLanguage } from '@/lib/language-context'


export default function Home() {
  const { language } = useLanguage()

  return (
    <div className="cyberpunk-grid noise min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Problem & Solution */}
      <ProblemSolution />

      {/* Key Modules */}
      <KeyModules />

      {/* AI Investment Advisor */}
      <AIConsultant />

      {/* Metrics */}
      <MetricsPanel />

      {/* Use Cases */}
      <UseCases />

      {/* Roadmap */}
      <TimelineRoadmap />

      {/* FAQ */}
      <FAQ />

      {/* Contact */}
      <ContactForm />

      {/* Footer */}
      <FooterCRT />
    </div>
  )
}
