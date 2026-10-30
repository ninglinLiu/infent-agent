import { NextRequest, NextResponse } from 'next/server'
import { accountAuth, accountError, AccountError, readBody } from '@/lib/account/server'
import { watchItem } from '@/lib/account/schemas'

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const ctx = await accountAuth.require(req)
    const { data, error } = await ctx.db.from('watchlist_items').select('symbol,created_at').eq('user_id', ctx.user.id).order('created_at', { ascending: false })
    if (error) throw error
    return ctx.finish(NextResponse.json({ items: data }))
  } catch (error) { return accountError(error) }
}
async function write(req: NextRequest, remove: boolean) {
  try {
    const ctx = await accountAuth.require(req)
    const parsed = watchItem.safeParse(await readBody(req))
    if (!parsed.success) throw new AccountError(400, 'Invalid symbol.')
    const query = ctx.db.from('watchlist_items')
    const { error } = remove ? await query.delete().eq('user_id', ctx.user.id).eq('symbol', parsed.data.symbol) : await query.upsert({ user_id: ctx.user.id, ...parsed.data }, { onConflict: 'user_id,symbol' })
    if (error) throw error
    return ctx.finish(NextResponse.json({ ok: true }))
  } catch (error) { return accountError(error) }
}
export const POST = (req: NextRequest) => write(req, false)
export const DELETE = (req: NextRequest) => write(req, true)
