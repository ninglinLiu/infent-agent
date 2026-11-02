/**
 * 前后端之间的极简流式协议。
 *
 * 为什么不用 AI SDK 的 data-stream 协议：我们只需要「一段流式正文 + 一小段结尾元数据」，
 * 自定义一个分隔符最简单，客户端用原生 fetch + ReadableStream 就能解析，
 * 而且即使元数据没送到，正文依然可读（优雅降级）。
 *
 * 响应体形如：
 *   正文逐字流式输出……␞{"type":"tool_start",…}␞……正文继续……
 *   \n<<<INFENT_META>>>{"strategyIds":[],"sources":["预注册证伪流程"]}
 *
 * 工具事件夹在正文里，用 U+001E（记录分隔符）包裹。服务端会从模型正文里删掉这个字符，
 * JSON 里的 < 也转义，所以事件既不会被模型伪造，也不会和元数据分隔符混淆。
 * 不认识事件的旧客户端只会看到多出的控制字符，正文依旧可读。
 */

import type { ToolTrace } from './tools'
import type { StrategySelection } from './structured'

export const META_DELIMITER = '\n<<<INFENT_META>>>'
export const EVENT_MARK = '\u001e'

export type StreamEvent =
  | { type: 'tool_start'; id: string; name: string; arguments: Record<string, unknown> }
  | { type: 'tool_end'; trace: ToolTrace }

export function encodeEvent(event: StreamEvent): string {
  return EVENT_MARK + JSON.stringify(event).replace(/</g, '\\u003c') + EVENT_MARK
}

export function sanitizeModelText(text: string): string {
  return text.split(EVENT_MARK).join('')
}

/** 从（已去掉元数据的）正文里取出完整事件；尚未收完的事件留到下一次解析。 */
export function splitEvents(raw: string): { text: string; events: StreamEvent[] } {
  const parts = raw.split(EVENT_MARK)
  // 段数为偶数说明最后一个事件还没收到结束符
  const complete = parts.length % 2 === 1 ? parts : parts.slice(0, -1)
  const events: StreamEvent[] = []
  let text = ''
  complete.forEach((part, i) => {
    if (i % 2 === 0) { text += part; return }
    try {
      const event = JSON.parse(part)
      if (event && (event.type === 'tool_start' || event.type === 'tool_end')) events.push(event as StreamEvent)
    } catch { /* 损坏的事件直接丢弃 */ }
  })
  return { text, events }
}

export type ChatMeta = {
  persistenceFailed?: boolean
  /** 服务端确定性匹配出的策略卡 id，对应 lib/mock/agent.ts 的 STRATEGIES */
  strategyIds: string[]
  /** 本次回答检索到的知识库来源文档名，用于前端标注引用 */
  sources: string[]
  /** 是否运行在无模型 key 的降级模式 */
  degraded?: boolean
  refused?: boolean
  tools?: ToolTrace[]
  strategyMode?: StrategySelection['mode']
  strategyCards?: StrategySelection['cards']
}

export function encodeMeta(meta: ChatMeta): string {
  return META_DELIMITER + JSON.stringify(meta)
}

/** 从完整响应文本里切出正文与元数据。元数据缺失时返回空 meta。 */
export function splitMeta(raw: string): { text: string; meta: ChatMeta | null } {
  const i = raw.indexOf(META_DELIMITER)
  if (i === -1) {
    // Do not flash a partially received metadata delimiter in the chat bubble.
    for (let n = Math.min(raw.length, META_DELIMITER.length - 1); n > 0; n--) {
      if (raw.endsWith(META_DELIMITER.slice(0, n))) return { text: raw.slice(0, -n), meta: null }
    }
    return { text: raw, meta: null }
  }
  const text = raw.slice(0, i)
  const jsonPart = raw.slice(i + META_DELIMITER.length).trim()
  try {
    const meta = JSON.parse(jsonPart)
    if (!Array.isArray(meta.strategyIds) || !meta.strategyIds.every((v: unknown) => typeof v === 'string') ||
        !Array.isArray(meta.sources) || !meta.sources.every((v: unknown) => typeof v === 'string')) return { text, meta: null }
    return { text, meta: meta as ChatMeta }
  } catch {
    return { text, meta: null }
  }
}
