import type { ChatMeta } from '@/lib/ai/protocol'
import { AccountError, type AccountContext } from './server'

export const chatStorage = {
  async begin(ctx: AccountContext, conversationId: string | undefined, question: string, requestId: string) {
    const { data, error } = await ctx.db.rpc('begin_chat', { p_conversation_id: conversationId ?? null, p_question: question, p_request_id: requestId })
    if (error) {
      if (error.message.includes('Quota exceeded')) throw new AccountError(429, '已达到对话额度，请稍后再试 / Chat quota reached.')
      if (error.message.includes('Conversation not found')) throw new AccountError(404, 'Conversation not found.')
      if (error.message.includes('Duplicate request')) throw new AccountError(409, 'Request already submitted.')
      throw error
    }
    return data as string
  },
  async finish(ctx: AccountContext, requestId: string, content: string, meta: ChatMeta, status: 'complete' | 'failed' | 'cancelled') {
    const { error } = await ctx.db.from('messages').update({ content, meta, status }).eq('id', requestId).eq('user_id', ctx.user.id)
    if (error) throw error
  },
}
