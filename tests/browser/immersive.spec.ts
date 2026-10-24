import { test, expect } from './fixtures'

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'The night study is desktop only')
})

test('house presents three entrances and Escape returns from the unified workspace', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.locator('.night-study')).toHaveAttribute('data-scene-ready', 'true', { timeout: 30_000 })
  await expect(page.locator('canvas')).toHaveCount(1)
  await expect(page.locator('.night-entry-card')).toHaveCount(3)
  await expect(page.locator('.night-home')).toBeVisible()
  await page.locator('.night-scene').press('Enter')
  await expect(page.locator('.unified-workspace')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.unified-workspace')).toBeHidden()
  await expect(page.locator('.night-scene')).toBeFocused()
  await expect(page.locator('.night-home')).toBeVisible()
})

test('WebGL failure still allows entry to the existing console', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.goto('/dashboard')
  await expect(page.getByText(/3D 场景暂不可用/)).toBeVisible()
  await page.locator('.night-entry-card--workspace').click()
  await expect(page.locator('.unified-workspace')).toBeVisible()
  await expect(page.locator('.unified-workspace')).toHaveAttribute('data-section', 'ai')
})
