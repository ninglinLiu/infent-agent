import { NextRequest, NextResponse } from 'next/server'
import { accountAuth, accountError, AccountError, readBody } from '@/lib/account/server'
import { progressPatch } from '@/lib/account/schemas'
import { EMPTY_ACADEMY } from '@/lib/academy'

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const ctx = await accountAuth.require(req)
    const { data, error } = await ctx.db.from('learning_progress').select('state').eq('user_id', ctx.user.id).maybeSingle()
    if (error) throw error
    const profile = await ctx.db.from('profiles').select('display_name').eq('id', ctx.user.id).single()
    if (profile.error) throw profile.error
    return ctx.finish(NextResponse.json({ state: { ...EMPTY_ACADEMY, ...data?.state, name: profile.data.display_name || data?.state?.name || '' } }))
  } catch (error) { return accountError(error) }
}
export async function PATCH(req: NextRequest) {
  try {
    const ctx = await accountAuth.require(req)
    const parsed = progressPatch.safeParse(await readBody(req))
    if (!parsed.success) throw new AccountError(400, 'Invalid learning progress.')
    if (parsed.data.name !== undefined) {
      const profile = await ctx.db.from('profiles').update({ display_name: parsed.data.name }).eq('id', ctx.user.id)
      if (profile.error) throw profile.error
    }
    const { data, error } = await ctx.db.rpc('save_learning_progress', { patch: parsed.data })
    if (error) throw error
    return ctx.finish(NextResponse.json({ state: { ...EMPTY_ACADEMY, ...data } }))
  } catch (error) { return accountError(error) }
}
