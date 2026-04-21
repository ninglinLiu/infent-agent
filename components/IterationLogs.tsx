'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Users, Star } from 'lucide-react'

interface Iteration {
  version: string
  title: string
  description: string
  feedback: string
  features: string[]
  color: 'cyan' | 'magenta' | 'purple' | 'green'
}

const iterations: Iteration[] = [
  {
    version: 'V1.0',
    title: 'Complex Risk Dashboard',
    description: 'Initial design with multiple risk metrics, complex charts, and detailed analytics panels.',
    feedback: 'Team feedback: "Too overwhelming for non-professional investors. Need simplification."',
    features: [
      'Multi-dimensional risk metrics',
      'Complex radar charts',
      'Detailed analytics panels',
      'Real-time data streams'
    ],
    color: 'cyan'
  },
  {
    version: 'V2.0',
    title: 'Simplified Risk Indicators',
    description: 'Reduced complexity with color-coded risk levels and simplified visualizations.',
    feedback: 'User testing: "Better, but still not intuitive enough. Need clearer visual cues."',
    features: [
      'Color-coded risk levels',
      'Simplified charts',
      'Key metrics focus',
      'Reduced information density'
    ],
    color: 'magenta'
  },
  {
    version: 'V3.0',
    title: 'Risk Glitch Alert',
    description: 'Final iteration: Intuitive "glitch" visual effect that immediately signals risk, inspired by cyberpunk aesthetics.',
    feedback: 'Group consensus: "Perfect! Simple, intuitive, and visually engaging. The glitch effect instantly communicates risk."',
    features: [
      'Intuitive glitch visual effect',
      'Instant risk communication',
      'Cyberpunk aesthetic integration',
      'User-friendly for all investors'
    ],
    color: 'green'
  }
]

const colorClasses = {
  cyan: 'border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.3)]',
  magenta: 'border-magenta-500 text-magenta-400 shadow-[0_0_20px_rgba(255,0,255,0.3)]',
  purple: 'border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
  green: 'border-green-500 text-green-400 shadow-[0_0_20px_rgba(0,255,136,0.3)]'
}

export function IterationLogs() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentIteration = iterations[currentIndex]

  const nextIteration = () => {
    setCurrentIndex((prev) => (prev + 1) % iterations.length)
  }

  const prevIteration = () => {
    setCurrentIndex((prev) => (prev - 1 + iterations.length) % iterations.length)
  }

  return (
    <section id="iteration-logs" className="py-20 container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-4 neon-text-purple">
        Iteration Logs
      </h2>
      <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
        Evolution of the risk visualization feature, demonstrating how group feedback simplified the concept into the intuitive &quot;Risk Glitch&quot; alert.
      </p>

      <div className="max-w-5xl mx-auto">
        {/* Version Timeline */}
        <div className="flex justify-center items-center gap-4 mb-8">
          {iterations.map((iter, index) => (
            <div key={iter.version} className="flex items-center">
              <button
                onClick={() => setCurrentIndex(index)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  index === currentIndex
                    ? `${colorClasses[iter.color]} bg-black/50`
                    : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                {iter.version}
              </button>
              {index < iterations.length - 1 && (
                <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 mx-2"></div>
              )}
            </div>
          ))}
        </div>

        {/* Current Iteration Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`border-2 ${colorClasses[currentIteration.color]}`}>
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-400">{currentIteration.version}</span>
                      <h3 className="text-3xl font-bold">{currentIteration.title}</h3>
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed mt-4">
                      {currentIteration.description}
                    </p>
                  </div>
                </div>

                {/* Feedback Section */}
                <div className="bg-black/30 border border-current/20 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-current flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-2">Group Feedback:</h4>
                      <p className="text-gray-300 italic">&quot;{currentIteration.feedback}&quot;</p>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Key Features:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentIteration.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2 text-gray-300"
                      >
                        <div className={`w-2 h-2 rounded-full bg-current`}></div>
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={prevIteration}
            className="p-3 rounded-lg border-2 border-purple-500/50 hover:border-purple-500 hover:bg-purple-500/10 transition-all"
            aria-label="Previous iteration"
          >
            <ChevronLeft className="h-5 w-5 text-purple-400" />
          </button>
          
          <div className="flex gap-2">
            {iterations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-purple-500 scale-125'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to iteration ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextIteration}
            className="p-3 rounded-lg border-2 border-purple-500/50 hover:border-purple-500 hover:bg-purple-500/10 transition-all"
            aria-label="Next iteration"
          >
            <ChevronRight className="h-5 w-5 text-purple-400" />
          </button>
        </div>

        {/* Evolution Summary */}
        <div className="mt-12 text-center">
          <Card className="border-2 border-purple-500/50 bg-black/30">
            <CardContent className="p-6">
              <p className="text-gray-300 leading-relaxed">
                <span className="neon-text-purple font-semibold">Evolution Summary:</span> Through iterative design and group feedback, 
                the risk visualization evolved from a complex dashboard to an intuitive &quot;Risk Glitch&quot; alert system, 
                making risk communication accessible to all investors regardless of their financial expertise.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

