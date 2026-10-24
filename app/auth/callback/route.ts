import { NextRequest, NextResponse } from 'next/server'
import { requestAccount, accountError } from '@/lib/account/server'
import { safeReturnPath } from '@/lib/account/config'

export async function GET(req: NextRequest) {
  try {
    const ctx = requestAccount(req)
    const code = req.nextUrl.searchParams.get('code')
    if (code) {
      const { error } = await ctx.db.auth.exchangeCodeForSession(code)
      if (!error) return ctx.finish(NextResponse.redirect(new URL(safeReturnPath(req.nextUrl.searchParams.get('next')), req.url)))
    }
    return ctx.finish(NextResponse.redirect(new URL('/login?error=callback', req.url)))
  } catch (error) { return accountError(error) }
}
