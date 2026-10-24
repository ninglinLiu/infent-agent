import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { accountAuth, accountError, AccountError } from '@/lib/account/server'

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const ctx = await accountAuth.require(req)
    const id = req.nextUrl.searchParams.get('id')
    if (id) {
      if (!z.string().uuid().safeParse(id).success) throw new AccountError(400, 'Invalid conversation.')
      const { data: conversation, error: lookupError } = await ctx.db.from('conversations').select('id,title').eq('id', id).eq('user_id', ctx.user.id).maybeSingle()
      if (lookupError) throw lookupError
      if (!conversation) throw new AccountError(404, 'Conversation not found.')
      const { data, error } = await ctx.db.from('messages').select('id,role,content,meta,status,created_at').eq('conversation_id', id).eq('user_id', ctx.user.id).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100)
      if (error) throw error
      return ctx.finish(NextResponse.json({ conversation, messages: (data ?? []).reverse() }))
    }
    const { data, error } = await ctx.db.from('conversations').select('id,title,created_at,updated_at').eq('user_id', ctx.user.id).order('updated_at', { ascending: false }).limit(100)
    if (error) throw error
    return ctx.finish(NextResponse.json({ conversations: data }))
  } catch (error) { return accountError(error) }
}
