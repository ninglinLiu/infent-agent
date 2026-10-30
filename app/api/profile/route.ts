import { NextRequest, NextResponse } from 'next/server'
import { accountAuth, accountError, AccountError, readBody } from '@/lib/account/server'
import { profilePatch } from '@/lib/account/schemas'

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const ctx = await accountAuth.require(req)
    const { data, error } = await ctx.db.from('profiles').select('id, display_name, language').eq('id', ctx.user.id).single()
    if (error) throw error
    return ctx.finish(NextResponse.json({ profile: data, email: ctx.user.email, registeredAt: ctx.user.created_at, lastSignInAt: ctx.user.last_sign_in_at, emailVerified: !!ctx.user.email_confirmed_at }))
  } catch (error) { return accountError(error) }
}
export async function PATCH(req: NextRequest) {
  try {
    const ctx = await accountAuth.require(req)
    const parsed = profilePatch.safeParse(await readBody(req))
    if (!parsed.success) throw new AccountError(400, 'Invalid profile.')
    const { data, error } = await ctx.db.from('profiles').update(parsed.data).eq('id', ctx.user.id).select('id, display_name, language').single()
    if (error) throw error
    return ctx.finish(NextResponse.json({ profile: data }))
  } catch (error) { return accountError(error) }
}
