import { test as base, expect } from '@playwright/test'
import { EMPTY_ACADEMY } from '../../lib/academy'

// UI-only authenticated fixture. Real auth/RLS is covered by accounts-live.spec.ts.
// These interceptors exist exclusively in Playwright, never in application code.
export const test = base.extend({
  page: async ({ page, context }, use) => {
    const user = { id: '00000000-0000-4000-8000-000000000099', aud: 'authenticated', role: 'authenticated', email: 'fixture@example.invalid', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
    const exp = Math.floor(Date.now() / 1000) + 3600
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
    const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp, aud: 'authenticated', role: 'authenticated' })}.ui-test-only`
    const session = { access_token: accessToken, refresh_token: 'ui-test-only', token_type: 'bearer', expires_at: exp, expires_in: 3600, user }
    const project = process.env.E2E_SUPABASE_PROJECT_REF || 'bofqqjgdkubmjdnpalqq'
    await context.addCookies([{ name: `sb-${project}-auth-token`, value: `base64-${encode(session)}`, domain: 'localhost', path: '/', sameSite: 'Lax' }])
    await page.route('**/auth/v1/user', route => route.fulfill({ json: user }))
    let state = { ...EMPTY_ACADEMY }
    await page.route('**/api/progress', async route => {
      if (route.request().method() === 'PATCH') state = { ...state, ...route.request().postDataJSON() }
      await route.fulfill({ json: { state } })
    })
    await page.route('**/api/conversations', route => route.fulfill({ json: { conversations: [] } }))
    await page.route('**/api/profile', route => route.fulfill({ json: { profile: { display_name: '' }, email: user.email } }))
    await page.route('**/api/learning', route => route.fulfill({ json: { courses: [], attempts: [], entitlements: [] } }))
    await use(page)
  },
})
export { expect }
