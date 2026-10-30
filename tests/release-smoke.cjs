// Read-only production/candidate checks. Never signs up users or writes application data.
const { chromium, expect } = require('@playwright/test')
const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync } = require('node:fs')

;(async () => {
  const base = new URL(process.argv[2] || 'https://omniaihello.com')
  assert.equal(base.protocol, 'https:')
  assert.ok(base.hostname === 'omniaihello.com' || /^infent-agent-[a-z0-9]+-123lkflhdskjfs-projects\.vercel\.app$/.test(base.hostname))
  const browser = await chromium.launch({ channel: 'msedge' })
  const context = await browser.newContext({ baseURL: base.origin, viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const result = { url: base.origin, checkedAt: new Date().toISOString(), readOnly: true, api: {} }
  try {
    const root = await context.request.get('/', { maxRedirects: 0 })
    assert.equal(root.status(), 307)
    assert.equal(new URL(root.headers().location, base).pathname, '/login')
    await page.goto('/login')
    await expect(page.getByRole('button', { name: '登录', exact: true })).toBeEnabled()
    await expect(page.getByRole('link', { name: /以访客模式体验/ })).toHaveAttribute('href', '/dashboard')
    await page.getByRole('button', { name: '创建账号', exact: true }).click()
    await expect(page.getByRole('button', { name: '注册并登录', exact: true })).toBeVisible()
    result.registrationForm = true
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Create account & sign in', exact: true })).toBeVisible()
    const scripts = await page.locator('script[src]').evaluateAll(nodes => nodes.map(n => n.src))
    const source = (await Promise.all(scripts.map(async url => (await context.request.get(url)).text()))).join('\n')
    assert.ok(source.includes('bofqqjgdkubmjdnpalqq.supabase.co'), 'Client must use the production database')
    assert.ok(!source.includes('sscjolfuydqmskqzfppn'), 'Staging configuration must not ship')
    result.productionDatabase = true
    const key = source.match(/sb_publishable_[A-Za-z0-9_-]+/)
    assert.ok(key, 'Public browser key missing')
    const settings = await context.request.get('https://bofqqjgdkubmjdnpalqq.supabase.co/auth/v1/settings', { headers: { apikey: key[0] } })
    assert.equal(settings.status(), 200)
    assert.equal((await settings.json()).mailer_autoconfirm, true)
    result.emailConfirmationDisabled = true
    for (const route of ['learning', 'conversations', 'profile', 'progress', 'watchlist']) {
      const response = await context.request.get('/api/' + route)
      assert.equal(response.status(), 401, route)
      result.api[route] = response.status()
    }
    for (const path of ['/.learning-live-accounts.json', '/.env.staging.public.local']) {
      assert.equal((await context.request.get(path)).status(), 404, 'Private artifact must be absent')
    }
    await page.getByRole('link', { name: /Continue as a guest/ }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('The curious corner', { exact: true })).toBeVisible()
    await expect(page.locator('.night-study')).toHaveAttribute('data-scene-ready', 'true', { timeout: 45000 })
    await expect(page.locator('.night-fallback')).toHaveCount(0)
    await expect(page.locator('canvas')).toBeVisible()
    result.house3D = true
    result.guest = true
    if (base.hostname === 'omniaihello.com') {
      const www = await context.request.get('https://www.omniaihello.com/', { maxRedirects: 0 })
      assert.equal(www.status(), 308)
      assert.equal(new URL(www.headers().location).hostname, 'omniaihello.com')
      result.wwwRedirect = 308
    }
    assert.deepEqual(errors, [])
    result.browserErrors = errors.length
    result.passed = true
    mkdirSync('test-results', { recursive: true })
    await page.screenshot({ path: `test-results/release-${base.hostname === 'omniaihello.com' ? 'production' : 'candidate'}.png` })
    writeFileSync(`test-results/release-${base.hostname}.json`, JSON.stringify(result, null, 2))
    console.log(JSON.stringify(result, null, 2))
  } finally { await browser.close() }
})().catch(error => { console.error(error.message); process.exit(1) })
