import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { accountConfig } from './config'
import { accountTransport } from './fetch'

export class AccountError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export function requestAccount(req: NextRequest) {
  const config = accountConfig()
  if (!config) throw new AccountError(503, '账号服务尚未配置 / Account service is not configured.')
  const changed: { name: string; value: string; options: CookieOptions }[] = []
  const db = createServerClient(config.url, config.key, { global: { fetch: accountTransport }, cookies: {
    getAll: () => req.cookies.getAll(),
    setAll: values => { values.forEach(value => { req.cookies.set(value.name, value.value); changed.push(value) }) },
  } })
  const finish = (response: Response) => {
    const result = new NextResponse(response.body, response)
    result.headers.set('Cache-Control', 'private, no-store')
    result.headers.set('Vary', 'Cookie')
    changed.forEach(cookie => result.cookies.set(cookie.name, cookie.value, cookie.options))
    return result
  }
  return { db, finish }
}

// All data routes authenticate here; a browser-supplied user ID is never trusted.
export const accountAuth = {
  async require(req: NextRequest) {
    const origin = req.headers.get('origin')
    if (!['GET', 'HEAD'].includes(req.method) && origin && origin !== req.nextUrl.origin) {
      throw new AccountError(403, 'Cross-origin request rejected.')
    }
    const context = requestAccount(req)
    const { data: { user }, error } = await context.db.auth.getUser()
    if (error || !user) throw new AccountError(401, '请先登录 / Please sign in.')
    return { ...context, user }
  },
}
export type AccountContext = Awaited<ReturnType<typeof accountAuth.require>>

export function accountError(error: unknown) {
  const known = error instanceof AccountError
  return NextResponse.json({ error: known ? error.message : '服务暂时不可用，请重试 / Service unavailable. Please retry.' }, { status: known ? error.status : 503, headers: { 'Cache-Control': 'private, no-store' } })
}

export async function readBody(req: NextRequest, limit = 8192) {
  const reader = req.body?.getReader()
  if (!reader) throw new AccountError(400, 'Missing request body.')
  let length = 0
  const parts: Uint8Array[] = []
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > limit) { await reader.cancel(); throw new AccountError(413, 'Request too large.') }
      parts.push(value)
    }
    try { return JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown }
    catch { throw new AccountError(400, 'Invalid JSON.') }
  } finally { reader.releaseLock() }
}
