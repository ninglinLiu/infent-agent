import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getChatConfig, getRequestTimeoutMs, LIMITS } from '@/lib/ai/config'
import { buildSystemPrompt, degradedNotice } from '@/lib/ai/system-prompt'
import { retrieve, formatContext, sourceNames } from '@/lib/ai/retrieve'
import { encodeEvent, encodeMeta, sanitizeModelText, type ChatMeta, type StreamEvent } from '@/lib/ai/protocol'
import { refusalReason, refusalText } from '@/lib/ai/policy'
import { runAgent } from '@/lib/ai/agent'
import { accountAuth, accountError, type AccountContext } from '@/lib/account/server'
import { chatStorage } from '@/lib/account/chat'
import { randomUUID } from 'node:crypto'
import { getLearningContext } from '@/lib/account/learning-context'
import { localDemoEnabled, localOffline } from '@/lib/local/config'
import { localAnswer } from '@/lib/local/answer'
import { LOCAL_SYMBOLS, SNAPSHOT_END } from '@/lib/local/market'
import { ProviderError } from '@/lib/ai/provider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const inputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(LIMITS.maxCharsPerMessage) }).strict()).min(1).max(LIMITS.maxMessages),
  lang: z.enum(['zh', 'en']).default('zh'), surface: z.string().max(100).optional(),
  conversationId: z.string().uuid().optional(), requestId: z.string().uuid().optional(),
}).strict()
const hits = new Map<string, number[]>()

function rateLimited(ip: string) {
  const now = Date.now()
  for (const [key, times] of hits) if (!times.some(t => now - t < LIMITS.rateWindowMs)) hits.delete(key)
  const times = (hits.get(ip) ?? []).filter(t => now - t < LIMITS.rateWindowMs)
  if (times.length >= LIMITS.rateMaxRequests || (!hits.has(ip) && hits.size >= 5000)) return true
  hits.set(ip, [...times, now])
  return false
}

const headers = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' }

export async function POST(req: NextRequest) {
  // Bound actual bytes, not just a user-controlled Content-Length header.
  const reader = req.body?.getReader()
  if (!reader) return new Response('Missing body', { status: 400 })
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 128_000) { await reader.cancel(); return new Response('Request too large', { status: 413 }) }
      chunks.push(value)
    }
  } catch { return new Response('Invalid request body', { status: 400 }) }
  finally { reader.releaseLock() }

  let payload: z.infer<typeof inputSchema>
  try { payload = inputSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
  catch { return new Response('Invalid messages, language or request format', { status: 400 }) }
  const { messages, lang } = payload
  if (messages[messages.length - 1].role !== 'user') return new Response('Last message must be from the user', { status: 400 })
  let account: AccountContext
  try { account = await accountAuth.require(req) } catch (error) { return accountError(error) }
  // Shared campus Wi-Fi must not spend every student's allowance as one IP.
  if (!localDemoEnabled() && rateLimited(account.user.id)) return account.finish(new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60' } }))

  const question = messages[messages.length - 1].content
  const requestId = payload.requestId ?? randomUUID()
  let conversationId: string
  try { conversationId = await chatStorage.begin(account, payload.conversationId, question, requestId) }
  catch (error) { return account.finish(accountError(error)) }
  const responseHeaders = { ...headers, 'X-Conversation-Id': conversationId }
  const meta: ChatMeta = { strategyIds: [], sources: [], tools: [], strategyMode: 'none' }
  const savedResponse = async (text: string, metadata: ChatMeta) => {
    try { await chatStorage.finish(account, requestId, text, metadata, metadata.degraded ? 'failed' : 'complete') }
    catch { metadata.persistenceFailed = true }
    return account.finish(new Response(text + encodeMeta(metadata), { headers: responseHeaders }))
  }
  const reason = refusalReason(question)
  if (reason) return savedResponse(refusalText(reason, lang), { ...meta, refused: true })
  if (localOffline()) {
    const demo=await localAnswer(question,lang)
    meta.demo=true; meta.sources=[demo.source]; meta.tools=[demo.trace]
    try { await chatStorage.finish(account,requestId,demo.text,meta,demo.trace.result.ok?'complete':'failed') } catch { meta.persistenceFailed=true }
    return account.finish(new Response(encodeEvent({type:'tool_start',id:demo.trace.id,name:demo.trace.name,arguments:demo.trace.arguments})+encodeEvent({type:'tool_end',trace:demo.trace})+demo.text+encodeMeta(meta),{headers:responseHeaders}))
  }
  const config = getChatConfig()
  if (!config) return savedResponse(degradedNotice(lang), { ...meta, degraded: true, errorCode:'MODEL_NOT_CONFIGURED' })

  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), localDemoEnabled() ? Math.min(25_000,getRequestTimeoutMs()) : getRequestTimeoutMs())
  const disconnect = () => abort.abort()
  req.signal.addEventListener('abort', disconnect, { once: true })
  if (req.signal.aborted) abort.abort()
  let cancelled = false
  const encoder = new TextEncoder()
  const cleanup = () => { clearTimeout(timer); req.signal.removeEventListener('abort', disconnect) }
  return account.finish(new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      let content = ''
      const emit = (raw: string) => { const text = sanitizeModelText(raw); content += text; if (!cancelled) controller.enqueue(encoder.encode(text)) }
      // 工具事件只进流、不进持久化正文；完整 trace 仍在 meta.tools 里保存
      const event = (value: StreamEvent) => { if (!cancelled) controller.enqueue(encoder.encode(encodeEvent(value))) }
      try {
        const { hits: found } = await retrieve(question)
        abort.signal.throwIfAborted()
        meta.sources = sourceNames(found)
        const learning = await getLearningContext(account).catch(() => '\nLearning records are unavailable. Do not claim to remember any learning actions.')
        const localContext=localDemoEnabled()?`\nLOCAL DEMO: Only ${LOCAL_SYMBOLS.join(', ')} have bundled historical data ending ${SNAPSHOT_END}. Use ONLY these symbols in strategies and drivers. All prices, backtests and executions use that historical snapshot, NOT live data. State this clearly. Do not call on-chain tools. No network market feed is available.`:''
        await runAgent([{ role: 'system', content: buildSystemPrompt({ lang, context: formatContext(found), surface: payload.surface }) + learning + localContext }, ...messages], {
          config, signal: abort.signal, onText: emit,
          onToolStart: call => event({ type: 'tool_start', ...call }),
          onTool: trace => { meta.tools!.push(trace); event({ type: 'tool_end', trace }) },
        })
        // 策略卡由 draft_strategy 的工具结果生成（meta.tools），不再从固定模板里匹配。
      } catch (error) {
        meta.degraded = true
        meta.errorCode=error instanceof ProviderError?error.code:abort.signal.aborted?'MODEL_TIMEOUT':'MODEL_INCOMPLETE'
        const code=meta.errorCode
        const reason=code==='MODEL_AUTH'||code==='MODEL_BALANCE'?(lang==='en'?'Check the server model key and balance.':'请检查服务端模型密钥与余额。'):code==='MODEL_TIMEOUT'?(lang==='en'?'The model timed out.':'模型响应超时。'):code==='MODEL_OUTPUT_LIMIT'?(lang==='en'?'The answer exceeded its output budget.':'回答超出单次输出长度。'):(lang==='en'?'The model connection was interrupted.':'模型连接中断。')
        emit(`\n\n[${reason}${lang==='en'?' Please retry; partial output is incomplete.':' 可以重新发送；已有内容不是完整结论。'}${localDemoEnabled()?(lang==='en'?' Switch to Offline demo above to continue immediately.':' 可在顶部切换“离线演示”立即继续。'):''}]`)
      } finally {
        cleanup()
        try { await chatStorage.finish(account, requestId, content, meta, cancelled ? 'cancelled' : meta.degraded ? 'failed' : 'complete') }
        catch { meta.persistenceFailed = true }
        if (!cancelled) { controller.enqueue(encoder.encode(encodeMeta(meta))); controller.close() }
      }
    },
    cancel() { cancelled = true; abort.abort(); cleanup() },
  }), { headers: responseHeaders }))
}
