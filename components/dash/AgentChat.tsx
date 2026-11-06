"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Bot, Send, Sparkles, Square, User2 } from "lucide-react"
import { AnswerText } from "@/components/agent/AnswerText"
import { ToolEvidence } from "@/components/agent/ToolEvidence"
import { DriverChips, StrategyCard } from "@/components/agent/StrategyCard"
import { draftFrom, driversFrom } from "@/components/terminal/ResearchCanvas"
import type { StrategyDraft } from "@/components/terminal/StrategyViz"
import type { ToolTrace } from "@/lib/ai/tools"
import { useLang } from "@/lib/i18n"
import { useChatStream, toParagraphs, type WireMessage } from "@/lib/ai/use-chat-stream"
import { accountFetch } from '@/lib/account/browser'
import { RequireAccount } from '@/components/account/AccountAccess'
import { useAccount } from '@/components/account/AccountProvider'
import type { ChatMeta, StreamEvent } from '@/lib/ai/protocol'
import { AsciiSharksBackdrop } from '@/components/agent/AsciiSharksBackdrop'
import sharkStyles from '@/components/agent/AsciiSharksBackdrop.module.css'

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | {
      id: string
      role: "assistant"
      paragraphs: string[]
      sources?: string[]
      tools?: ToolTrace[]
      streaming?: boolean
    }

export type AgentChatHandlers = {
  /** 每条工具开始/结束事件，研究画布据此实时联动 */
  onEvent?: (event: StreamEvent) => void
  /** 一轮提问开始 / 结束 */
  onTurn?: (state: 'start' | 'end') => void
  onDeploy?: (draft: StrategyDraft) => void
  onFocus?: (draft: StrategyDraft) => void
}

/** 演示用的快捷问题：第一条一轮就能出可执行策略。 */
const PROMPTS = [
  { zh: '10 万美元配一个策略', en: 'Build a $100k strategy', promptZh: '我有 10 万美元，能接受大约 15% 的回撤，看好 AI 但担心利率再上行，帮我做一个可以执行的投资策略。', promptEn: 'I have $100k, can tolerate about a 15% drawdown, like AI but worry about rates rising again. Build me an executable strategy.' },
  { zh: '什么在推动英伟达？', en: 'What moves NVIDIA?', promptZh: '用数据看看，过去一年什么在推动英伟达的股价？', promptEn: 'Using data, what has been moving NVIDIA over the past year?' },
  { zh: '港股 + 黄金稳健组合', en: 'HK + gold, steady', promptZh: '我偏保守，想用港股和黄金做一个稳健一点的组合，帮我出个策略书。', promptEn: 'I am conservative. Draft a steadier portfolio using Hong Kong equities and gold.' },
  { zh: '把回撤再压低一点', en: 'Lower the drawdown', promptZh: '把上一个策略的回撤再压低一点，告诉我改了什么。', promptEn: 'Lower the drawdown of the previous strategy and tell me what changed.' },
]

function ToolCards({ tools, handlers }: { tools?: ToolTrace[]; handlers: AgentChatHandlers }) {
  if (!tools?.length) return null
  const drafts = tools.map(draftFrom).filter((d): d is StrategyDraft => !!d)
  const drivers = tools.map(driversFrom).filter(Boolean)
  const other = tools.filter(t => !draftFrom(t) && !driversFrom(t))
  return <div className="space-y-2.5 pt-1">
    {drivers.map((report, i) => report && <DriverChips key={`d-${i}`} report={report} />)}
    {/* 同一轮里模型可能修订过策略，只展示最后一版 */}
    {drafts.length > 0 && <StrategyCard draft={drafts[drafts.length - 1]} onDeploy={handlers.onDeploy} onFocus={handlers.onFocus} />}
    <ToolEvidence tools={other} />
  </div>
}

function AssistantBubble({ m, handlers }: { m: Extract<ChatMessage, { role: "assistant" }>; handlers: AgentChatHandlers }) {
  const { t } = useLang()
  const empty = m.paragraphs.every((p) => !p)
  return (
    <div className="flex gap-2">
      <div className="shrink-0 mt-0.5">
        <div className="relative h-7 w-7 rounded-md surface-raised flex items-center justify-center ai-pulse">
          <Bot className="h-3.5 w-3.5 text-info" />
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold">{t("agent.name")}</span>
          <span className="chip info text-[9px] px-1.5 py-0">
            <Sparkles className="h-2 w-2" /> Research Agent
          </span>
        </div>
        <div className="space-y-1.5">
          {m.paragraphs.filter(Boolean).map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[13px] leading-relaxed text-[var(--fg-1)]"
            ><AnswerText text={p} /></motion.div>
          ))}
          {m.streaming && empty && (
            <div className="flex gap-1 pt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-info animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-info animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-info animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        <ToolCards tools={m.tools} handlers={handlers} />
        {m.sources && m.sources.length > 0 && (
          <div className="text-[10px] text-ghost border-t border-[var(--line-1)] pt-1.5 mt-1">
            {t("agent.sources")}：{m.sources.join(" · ")}
          </div>
        )}
      </div>
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2 justify-end">
      <div className="max-w-[85%] rounded-md rounded-br-sm px-3 py-2 text-[13px] bg-[var(--bg-3)] border border-[var(--line-2)]">
        {text}
      </div>
      <div className="shrink-0 mt-0.5">
        <div className="h-7 w-7 rounded-md bg-[var(--bg-3)] border border-[var(--line-2)] flex items-center justify-center">
          <User2 className="h-3.5 w-3.5 text-dim" />
        </div>
      </div>
    </div>
  )
}

export function AgentChat(handlers: AgentChatHandlers = {}) {
  const { user } = useAccount()
  return <RequireAccount><AccountChat key={user?.id} {...handlers} /></RequireAccount>
}

function AccountChat(handlers: AgentChatHandlers) {
  const { lang, t } = useLang()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { send, stop } = useChatStream()
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([])
  const [conversationId, setConversationId] = useState<string>()
  const [historyBusy, setHistoryBusy] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const selection = useRef(0)
  const latest = useRef(handlers)
  latest.current = handlers
  const refreshHistory = async (restore = false) => {
    try {
      const result = await accountFetch<{ conversations: { id: string; title: string }[] }>('/api/conversations')
      setConversations(result.conversations)
      if (restore && result.conversations[0]) await selectConversation(result.conversations[0].id)
    } catch (error) { setHistoryError((error as Error).message) }
  }
  // This component is keyed by verified account ID. Restore once per account mount.
  const initialHistory = useRef(async () => {
    setHistoryBusy(true)
    try { await refreshHistory(true) } finally { setHistoryBusy(false) }
  })
  useEffect(() => { void initialHistory.current() }, [])
  async function selectConversation(id: string) {
    if (busy || historyBusy) return
    const ticket = ++selection.current
    setHistoryError('')
    if (!id) { setConversationId(undefined); setMessages([]); return }
    setHistoryBusy(true)
    try {
      const result = await accountFetch<{ messages: { id: string; role: 'user' | 'assistant'; content: string; meta: ChatMeta; status: string }[] }>(`/api/conversations?id=${encodeURIComponent(id)}`)
      if (ticket !== selection.current) return
      setConversationId(id)
      setMessages(result.messages.map(message => message.role === 'user'
        ? { id: message.id, role: 'user', text: message.content }
        : { id: message.id, role: 'assistant', paragraphs: toParagraphs(message.content || (lang === 'en' ? '[This response was not completed. Please ask again.]' : '[此回答未完成，请重新提问。]')), sources: message.meta?.sources, tools: message.meta?.tools }))
    } catch (error) { setHistoryError((error as Error).message) }
    finally { if (ticket === selection.current) setHistoryBusy(false) }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  /** 统一的提问入口：接 /api/chat 流式返回，工具事件同步给研究画布。 */
  async function askModel(prompt: string) {
    const text = prompt.trim()
    if (!text || busy || historyBusy) return

    const userId = `u-${Date.now()}`
    const aiId = `a-${Date.now() + 1}`
    const history: WireMessage[] = [
      ...messages.map((m): WireMessage =>
        m.role === "user" ? { role: "user", content: m.text } : { role: "assistant", content: m.paragraphs.join("\n\n") }
      ),
      { role: "user", content: text },
    ]
    const patch = (fn: (m: Extract<ChatMessage, { role: 'assistant' }>) => Extract<ChatMessage, { role: 'assistant' }>) =>
      setMessages(prev => prev.map(m => m.id === aiId && m.role === 'assistant' ? fn(m) : m))

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text },
      { id: aiId, role: "assistant", paragraphs: [""], tools: [], streaming: true },
    ])
    setBusy(true)
    latest.current.onTurn?.('start')

    await send(history, {
      conversationId,
      onConversation: id => { setConversationId(id); void refreshHistory() },
      lang: lang === "en" ? "en" : "zh",
      surface: lang === "en" ? "the omniAI agent console with a live research canvas" : "带实时研究画布的 omniAI Agent 控制台",
      onEvent: event => {
        latest.current.onEvent?.(event)
        if (event.type === 'tool_end') patch(m => ({ ...m, tools: [...(m.tools ?? []), event.trace] }))
      },
      onText: (partial) => patch(m => ({ ...m, paragraphs: toParagraphs(partial) })),
      onDone: (final, meta) => {
        if (meta?.persistenceFailed) setHistoryError(lang === 'en' ? 'The response could not be saved. Copy it before leaving.' : '回答未能保存，请在离开前复制内容。')
        patch(m => ({ ...m, paragraphs: toParagraphs(final), sources: meta?.sources ?? [], tools: meta?.tools ?? m.tools ?? [], streaming: false }))
        setBusy(false)
        latest.current.onTurn?.('end')
      },
      onError: () => { setBusy(false); latest.current.onTurn?.('end') },
    })
  }

  function onSend() {
    const text = input.trim()
    if (!text) return
    setInput("")
    void askModel(text)
  }

  const hasDraft = messages.some(m => m.role === 'assistant' && m.tools?.some(t => draftFrom(t)))
  const fresh = messages.length === 0

  return (
    <div className="agent-chat surface h-full flex flex-col overflow-hidden">
      <div className="agent-chat-header px-4 py-3 border-b border-[var(--line-1)] flex items-center justify-between bg-[var(--bg-2)]">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 rounded-md surface-raised flex items-center justify-center ai-pulse">
            <Bot className="h-4 w-4 text-info" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm">{t("agent.name")}</span>
              <span className="chip up text-[9px] px-1.5 py-0">
                <span className="h-1 w-1 rounded-full bg-up animate-pulse" /> {t("agent.online")}
              </span>
            </div>
            <div className="text-[10px] text-ghost">{lang === 'en' ? 'Research → strategy → backtest → paper execution' : '研究 → 策略书 → 回测 → 模拟执行'}</div>
          </div>
        </div>
        <span className="chip info">
          <Sparkles className="h-2.5 w-2.5" /> DeepSeek · 5 tools
        </span>
      </div>

      <div className="account-history"><label htmlFor="chat-history">{lang === 'en' ? 'History' : '历史对话'}</label><select id="chat-history" value={conversationId ?? ''} disabled={busy || historyBusy} onChange={e => void selectConversation(e.target.value)}><option value="">{lang === 'en' ? 'New conversation' : '新对话'}</option>{conversations.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><button disabled={busy || historyBusy} onClick={() => void selectConversation('')}>{lang === 'en' ? 'New' : '新建'}</button></div>
      {historyError && <p role="status" className="account-sync">{historyError}<button onClick={() => { setHistoryError(''); void refreshHistory() }}>{lang === 'en' ? 'Retry' : '重试'}</button></p>}
      <div className={sharkStyles.stage}>
        <AsciiSharksBackdrop subdued={!fresh} />
        <div ref={scrollRef} className={`agent-chat-messages flex-1 overflow-y-auto thin-scroll px-3 py-3 space-y-3 ${sharkStyles.messages}`}>
          {fresh && <div className="agent-chat-welcome"><p>{lang === 'en' ? 'ONE QUESTION · ONE STRATEGY · ONE CLICK' : '一个问题 · 一份策略书 · 一键模拟执行'}</p><h2>{lang === 'en' ? 'What are you curious about?' : '今天，你想了解什么？'}</h2><span className="agent-chat-welcome-sub">{lang === 'en' ? 'Describe your capital, risk and view. The agent researches with live data, drafts a strategy, backtests it on two years of real prices, and lets you deploy it to a paper sandbox.' : '说说你的资金、风险承受和看法。Agent 会用实时数据研究、写出策略书、用两年真实价格回测，再一键部署到模拟沙箱。'}</span></div>}
          <AnimatePresence initial={false}>
            {messages.map((m) =>
              m.role === "user" ? (
                <UserBubble key={m.id} text={m.text} />
              ) : (
                <AssistantBubble key={m.id} m={m} handlers={handlers} />
              )
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="agent-chat-prompts px-3 py-2 border-t border-[var(--line-1)] bg-[var(--bg-1)]">
        <div className="flex flex-wrap gap-1.5">
          {PROMPTS.filter((_, i) => i < 3 || hasDraft).map((q) => (
            <button
              key={q.zh}
              disabled={busy}
              onClick={() => void askModel(lang === "en" ? q.promptEn : q.promptZh)}
              className="text-[11px] px-2 py-1 rounded-full border border-[var(--line-2)] bg-[var(--bg-2)] hover:border-[rgba(88,199,255,0.45)] hover:text-info hover:bg-[var(--info-soft)] disabled:opacity-50 transition"
            >
              {lang === "en" ? q.en : q.zh}
            </button>
          ))}
        </div>
      </div>

      <div className="agent-chat-composer px-3 py-2.5 border-t border-[var(--line-1)] bg-[var(--bg-2)] flex items-center gap-2">
        <input
          value={input}
          disabled={busy || historyBusy}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={lang === 'en' ? 'e.g. $50k, 10% max drawdown, I like semiconductors…' : '例如：5 万美元，最多亏 10%，看好半导体……'}
          aria-label={t('agent.placeholder')}
          maxLength={4000}
          className="min-w-0 flex-1 bg-[var(--bg-1)] border border-[var(--line-2)] rounded-md px-3 py-2 text-base sm:text-[13px] placeholder:text-[var(--fg-3)] focus:outline-none focus:border-[rgba(0,255,159,0.45)] focus:ring-up"
        />
        <button
          onClick={busy ? stop : onSend}
          disabled={!busy && !input.trim()}
          className="h-9 px-3 rounded-md bg-up text-black font-semibold text-[12px] flex items-center gap-1 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {busy ? <Square className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          {busy ? t('agent.stop') : t("agent.send")}
        </button>
      </div>
    </div>
  )
}
