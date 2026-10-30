import { test, expect } from './fixtures'

test('lavender house, animated AI, and shared tools remain consistent in both languages', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Desktop visual acceptance')
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.route('**/api/market/**', route => route.fulfill({ status: 503, json: { error: 'Visual test: market unavailable' } }))
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/dashboard')
  await expect(page.locator('.night-study')).toHaveAttribute('data-scene-ready', 'true', { timeout: 45000 })
  await expect(page.locator('.night-entry-card')).toHaveCount(3)
  await page.waitForTimeout(600)
  const cards = await page.locator('.night-entry-card').all()
  const bounds = await Promise.all(cards.map(card => card.boundingBox()))
  for (let i = 0; i < bounds.length; i++) for (let j = i + 1; j < bounds.length; j++) {
    const a = bounds[i]!, b = bounds[j]!
    expect(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y).toBe(true)
  }
  await page.screenshot({ path: 'docs/collab/visual-restoration/house-zh.png' })
  await page.locator('.night-hub-header button').click()
  await page.screenshot({ path: 'docs/collab/visual-restoration/house-en.png' })
  await page.locator('.night-entry-card--workspace').click()
  const orb = page.locator('.ascii-orb pre')
  await expect(orb).toBeVisible()
  const initial = await orb.textContent()
  await expect.poll(() => orb.textContent()).not.toBe(initial)
  await page.getByRole('button', { name: 'Pause character animation', exact: true }).click()
  const paused = await orb.textContent()
  await page.waitForTimeout(300)
  expect(await orb.textContent()).toBe(paused)
  await page.screenshot({ path: 'docs/collab/visual-restoration/agent-en.png' })
  await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click()
  await page.screenshot({ path: 'docs/collab/visual-restoration/agent-zh.png' })
  const marketFixture = {
    instrument: { symbol: 'NVDA', name: '图表测试', nameEn: 'Chart fixture', market: 'NASDAQ' }, interval: '60', source: 'yahoo', precision: 2,
    quote: { price: 126.5, change: 1.5, changePct: 1.2, currency: 'USD' },
    candles: Array.from({ length: 30 }, (_, i) => ({ time: 1760000000 + i * 3600, open: 100 + i, close: 101 + i, high: 103 + i, low: 99 + i, volume: 1000 + i * 100 })),
  }
  await page.route('**/api/market/klines?**', route => route.fulfill({ json: marketFixture }))
  await page.getByRole('button', { name: '刷新行情', exact: true }).click()
  await expect(page.locator('.quant-price')).toHaveText('126.5')
  await expect(page.locator('.quant-source')).toContainText('Yahoo Finance')
  await page.getByRole('button', { name: '打开交易所', exact: false }).click()
  await expect(page.locator('[data-view="markets"]')).toBeVisible()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'docs/collab/visual-restoration/exchange-zh.png' })
  const rail = page.locator('.unified-rail')
  await rail.getByRole('button', { name: '学习室', exact: true }).click()
  await expect(page.locator('.academy-gate')).toBeVisible()
  await page.waitForTimeout(1600)
  await page.screenshot({ path: 'docs/collab/visual-restoration/study-zh.png' })
  await page.getByRole('button', { name: '切换为英文', exact: true }).click()
  await page.screenshot({ path: 'docs/collab/visual-restoration/study-en.png' })
  await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click()
  await rail.getByRole('button', { name: 'AI 助手', exact: true }).click()
  await page.getByRole('button', { name: '播放字符动画', exact: true }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.ascii-orb button')).toBeHidden()
  const still = await orb.textContent()
  await page.waitForTimeout(300)
  expect(await orb.textContent()).toBe(still)
  expect(errors).toEqual([])
})
