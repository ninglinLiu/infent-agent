import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

// Opt-in REAL Auth + Next server + PostgREST. No routes or auth responses are mocked.
// Traces/videos are disabled: they must not record passwords or auth tokens.
test.use({ trace: 'off', video: 'off' })
test('staging A/B/C real sessions restore data and reject cross-account access', async ({ browser }, info) => {
  test.skip(process.env.INFENT_STAGING !== '1' || info.project.name !== 'desktop', 'Explicit isolated staging runner required')
  test.setTimeout(420_000)
  const cfg = JSON.parse(readFileSync('.env.staging.public.local', 'utf8'))
  expect(cfg.url).toBe('https://sscjolfuydqmskqzfppn.supabase.co')
  const fixture = JSON.parse(readFileSync('.learning-live-accounts.json', 'utf8'))
  expect(fixture.url).toBe(cfg.url)
  type User = { id: string; email: string; password: string; attempt: string; conversation: string }
  const { A, B, C } = fixture.users as Record<string, User>
  const report: Record<string, unknown> = { project: cfg.projectId, transport: 'real Supabase Auth + Next routes + PostgREST', mockedRequests: 0 }
  const browserErrors: string[] = []
  const contexts: BrowserContext[] = []
  const newContext = async () => {
    const ctx = await browser.newContext({ baseURL: 'http://localhost:3107', viewport: { width: 1440, height: 1500 }, reducedMotion: 'reduce' })
    contexts.push(ctx)
    ctx.on('page', p => {
      p.on('pageerror', e => browserErrors.push(e.message))
      p.on('request', request => {
        if (request.url().includes('.supabase.co')) expect(new URL(request.url()).hostname).toBe('sscjolfuydqmskqzfppn.supabase.co')
      })
    })
    return ctx
  }
  const json = async (p: Page, url: string, status = 200) => {
    const response = await p.request.get(url)
    expect(response.status(), url).toBe(status)
    return response.json()
  }
  const login = async (p: Page, user: User) => {
    await p.goto('/login')
    await p.getByLabel('邮箱', { exact: true }).fill(user.email)
    await p.getByLabel('密码', { exact: true }).fill(user.password)
    const auth = p.waitForResponse(r => r.url().startsWith(cfg.url + '/auth/v1/token') && r.request().method() === 'POST')
    await p.getByRole('button', { name: '登录', exact: true }).click()
    expect((await auth).status()).toBe(200)
    await p.waitForURL('**/dashboard', { timeout: 30000 })
    const profile = await json(p, '/api/profile')
    expect(profile.profile.id).toBe(user.id)
    expect(profile.registeredAt).toBeTruthy()
    expect(profile.lastSignInAt).toBeTruthy()
    return profile
  }
  const logout = async (p: Page) => {
    await p.goto('/account')
    await p.getByRole('button', { name: '退出登录', exact: true }).click()
    await p.waitForURL('**/login')
    expect((await p.request.get('/api/learning')).status()).toBe(401)
    expect((await p.request.get('/api/conversations')).status()).toBe(401)
  }
  const enterCase = async (p: Page) => {
    await p.goto('/dashboard')
    await p.locator('.night-entry-card--academy').click()
    await p.getByRole('button', { name: '案例实践', exact: true }).click()
  }
  const verifyA = async (p: Page) => {
    const data = await json(p, `/api/learning?attempt=${A.attempt}`)
    expect(data.attempt).toMatchObject({ user_id: A.id, scene: 3, cash_cents: 600000, shares: 40, total_cents: 918000, unrealized_cents: -82000, realized_cents: 0 })
    expect(data.choices.map((c: {action: string}) => c.action)).toEqual(['research', 'buy_40'])
    expect(data.attempt.notes).toEqual(['moat', 'valuation', 'position'])
    return data
  }
  mkdirSync('docs/collab/learning-live-validation', { recursive: true })
  try {
    let ctx = await newContext()
    let p = await ctx.newPage()
    const first = await login(p, A)
    await verifyA(p)
    await enterCase(p)
    await expect(p.getByTestId('account-total')).toHaveText('9,180.00', { timeout: 30000 })
    await expect(p.locator('.academy-case-notes .done')).toHaveCount(3)
    await expect(p.getByRole('progressbar', { name: '场景进度' })).toHaveAttribute('aria-valuenow', '2')
    await p.reload()
    await p.locator('.night-entry-card--academy').click()
    await p.getByRole('button', { name: '案例实践', exact: true }).click()
    await expect(p.getByTestId('account-total')).toHaveText('9,180.00', { timeout: 30000 })
    const afterPageVisit = await json(p, '/api/profile')
    expect(afterPageVisit.lastSignInAt).toBe(first.lastSignInAt)
    await p.screenshot({ path: 'docs/collab/learning-live-validation/A-scene-03.png', fullPage: true })
    // Real deterministic refusal exercises message persistence with no paid model call.
    const chat = await p.request.post('/api/chat', { data: { messages: [{ role: 'user', content: '今天天气怎么样？' }], lang: 'zh' } })
    expect(chat.status()).toBe(200)
    expect(await chat.text()).toContain('范围')
    const conversation = chat.headers()['x-conversation-id']
    expect(conversation).toBeTruthy()
    await p.getByRole('button', { name: 'AI 助手', exact: true }).click()
    await expect(p.locator('#chat-history')).toHaveValue(conversation, { timeout: 30000 })
    await expect(p.locator('.agent-chat-messages')).toContainText('今天天气怎么样')
    await json(p, '/api/learning?course=value-internal', 403)
    await logout(p)
    await ctx.close()

    ctx = await newContext()
    p = await ctx.newPage()
    await login(p, A)
    await verifyA(p)
    await enterCase(p)
    await expect(p.getByTestId('account-total')).toHaveText('9,180.00', { timeout: 30000 })
    await p.getByRole('button', { name: 'AI 助手', exact: true }).click()
    await expect(p.locator('#chat-history')).toHaveValue(conversation, { timeout: 30000 })
    await expect(p.locator('.agent-chat-messages')).toContainText('今天天气怎么样')
    report.A = { normalLogin: true, refresh: true, logoutAndFreshBrowserLogin: true, scene: 3, cash: 6000, shares: 40, total: 9180, ownConversationRestored: true, pageVisitsDoNotChangeLoginTime: true }

    // Another tab logs out A. The still-mounted old tab must discard personal caches.
    const control = await ctx.newPage()
    await logout(control)
    await expect(p.locator('.agent-chat-messages')).toHaveCount(0, { timeout: 30000 })
    await expect(p.getByRole('link', { name: '登录 / 注册', exact: true })).toBeVisible()
    await login(control, B)
    await p.goto('/dashboard')
    expect((await json(p, '/api/profile')).profile.id).toBe(B.id)
    await json(p, `/api/learning?attempt=${A.attempt}`, 404)
    await json(p, `/api/conversations?id=${conversation}`, 404)
    const b = await json(p, '/api/learning')
    expect(b.attempts.every((a: {user_id: string}) => a.user_id === B.id)).toBe(true)
    expect(b.attempts.find((a: {id: string}) => a.id === B.attempt)).toMatchObject({ status: 'completed', total_cents: 1376000 })
    expect(b.entitlements).toEqual([expect.objectContaining({ package_id: 'value-advanced', source: 'demo', active: true })])
    await json(p, '/api/learning?course=value-internal')
    expect((await json(p, '/api/conversations')).conversations).toHaveLength(0)
    await enterCase(p)
    await expect(p.getByTestId('account-total')).toHaveText('13,760.00', { timeout: 30000 })
    await expect(p.getByText('复盘已保存，本次尝试已完成。')).toBeVisible()
    await p.screenshot({ path: 'docs/collab/learning-live-validation/B-completed.png', fullPage: true })
    await p.goto('/account')
    await p.getByText('已解锁课程', { exact: true }).click()
    await expect(p.locator('details')).toContainText('演示权益')
    await expect(p.getByLabel('昵称', { exact: true })).toHaveValue('Demo B')
    report.B = { normalLogin: true, completed: true, total: 13760, demoAccess: true, privateARecords: '404', ownConversationsEmpty: true }

    await logout(p)
    await login(p, C)
    const c = await json(p, '/api/learning')
    expect(c.attempts).toEqual([]); expect(c.entitlements).toEqual([])
    expect((await json(p, '/api/conversations')).conversations).toEqual([])
    expect((await json(p, '/api/progress')).state.lessonStep).toBe(0)
    await json(p, `/api/learning?attempt=${A.attempt}`, 404)
    await json(p, `/api/learning?attempt=${B.attempt}`, 404)
    await json(p, `/api/conversations?id=${conversation}`, 404)
    await json(p, '/api/learning?course=value-internal', 403)
    const hijack = await p.request.post('/api/learning', { data: { operationId: randomUUID(), courseId: 'coca-cola', attemptId: A.attempt, revision: 2, action: 'sell_fear', reason: '' } })
    expect(hijack.status()).toBe(404)
    const forged = await p.request.post('/api/learning', { data: { operationId: randomUUID(), courseId: 'coca-cola', action: 'start', user_id: A.id, cash_cents: 999999 } })
    expect(forged.status()).toBe(400)
    await p.locator('.night-entry-card--workspace').click()
    await expect(p.locator('#chat-history option')).toHaveCount(1)
    await expect(p.locator('.agent-chat-messages')).not.toContainText('今天天气怎么样')
    await p.screenshot({ path: 'docs/collab/learning-live-validation/C-empty.png', fullPage: true })
    report.C = { normalLogin: true, attempts: 0, entitlements: 0, conversations: 0, restrictedContent: '403', crossAccountReadAndWrite: '404', forgedOwnershipAndBalance: '400' }
    await logout(p)
    expect(browserErrors).toEqual([])
    report.browserErrors = 0; report.crossTabCacheCleared = true; report.checkedAt = new Date().toISOString()
    writeFileSync('docs/collab/learning-live-validation/browser-result.json', JSON.stringify(report, null, 2))
  } finally { for (const ctx of contexts) await ctx.close() }
})
