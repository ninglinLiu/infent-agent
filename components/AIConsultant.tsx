'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, Bot, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Predefined responses for demo
const getAIResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase()
  
  if (lowerQuestion.includes('stock') || lowerQuestion.includes('recommend') || lowerQuestion.includes('fundamental')) {
    return `Based on our AI analysis, here are some fundamentally strong stocks worth considering:

1. **TechCorp Inc. (TECH)** - Strong fundamentals with:
   - P/E Ratio: 18.5 (below industry average)
   - Revenue Growth: 25% YoY
   - Debt-to-Equity: 0.3 (excellent)
   - Analyst Rating: Strong Buy

2. **GreenEnergy Ltd. (GREEN)** - Solid fundamentals:
   - P/E Ratio: 22.1
   - Revenue Growth: 32% YoY
   - Profit Margin: 15.8%
   - ESG Score: A+

3. **HealthCare Systems (HCS)** - Robust fundamentals:
   - P/E Ratio: 20.3
   - Revenue Growth: 18% YoY
   - ROE: 24.5%
   - Market Position: Leading

*Note: This is a demo response. Always conduct your own research and consult with a financial advisor before making investment decisions.*`
  }
  
  if (lowerQuestion.includes('risk') || lowerQuestion.includes('portfolio')) {
    return `Our AI risk management system analyzes multiple factors:
- Market volatility indicators
- Credit risk assessment
- Liquidity analysis
- Sector correlation
- Economic indicators

Would you like a detailed risk analysis for a specific portfolio?`
  }
  
  if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi') || lowerQuestion.includes('help')) {
    return `Hello! I'm your AI Investment Advisor. I can help you with:
- Stock recommendations based on fundamentals
- Risk analysis and portfolio optimization
- Market insights and trends
- Investment strategy consultation

Try asking: "What are some fundamentally strong stocks to recommend?"`
  }
  
  return `I understand you're asking about "${question}". As a demo AI advisor, I'm currently optimized to provide insights on:
- Stock recommendations with fundamental analysis
- Risk management strategies
- Portfolio optimization

For more specific queries, please ask about stock recommendations or risk analysis.`
}

export function AIConsultant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI Investment Advisor. How can I assist you today? Try asking: "What are some fundamentally strong stocks to recommend?"',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = getAIResponse(input.trim())
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
    setTimeout(() => {
      handleSend()
    }, 100)
  }

  return (
    <section id="ai-consultant" className="py-20 container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-12 neon-text-cyan">
        AI Investment Advisor
      </h2>
      <Card className="border-2 border-cyan-500 shadow-[0_0_30px_rgba(0,255,255,0.3)] max-w-4xl mx-auto">
        <CardHeader className="border-b border-cyan-500/20">
          <CardTitle className="neon-text-cyan flex items-center gap-2">
            <Bot className="h-6 w-6" />
            AI Investment Advisor Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-black/30">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-cyan-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-100'
                        : 'bg-gray-800/50 border border-gray-700 text-gray-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-purple-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="px-6 pt-4 pb-2 border-t border-cyan-500/20">
            <p className="text-xs text-gray-400 mb-2">Quick Questions:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickQuestion('What are some fundamentally strong stocks to recommend?')}
                className="text-xs border border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/10 text-cyan-300"
              >
                Stock Recommendations
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickQuestion('How do you analyze portfolio risk?')}
                className="text-xs border border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/10 text-cyan-300"
              >
                Risk Analysis
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickQuestion('Hello, how can you help me?')}
                className="text-xs border border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/10 text-cyan-300"
              >
                Get Help
              </Button>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-cyan-500/20 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about stocks, risk analysis, or investment strategies..."
              className="flex-1 px-4 py-2 bg-black border-2 border-cyan-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)]"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              variant="neon"
              className="px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

