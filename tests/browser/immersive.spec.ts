import { test, expect } from '@playwright/test'

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'The night study is desktop only')
})

test('initial scene has no visible interface and Escape returns from the console', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.locator('.night-study')).toHaveAttribute('data-scene-ready', 'true', { timeout: 30_000 })
  await expect(page.locator('canvas')).toHaveCount(1)
  await expect(page.locator('.night-study button, .night-study header, .night-study nav, .night-study footer')).toHaveCount(0)
  await expect(page.locator('.night-study')).toHaveText('')
  await page.locator('.night-scene').press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.night-scene')).toBeFocused()
  await expect(page.locator('.night-study')).toHaveText('')
})

test('WebGL failure still allows entry to the existing console', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2') return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.goto('/dashboard')
  await expect(page.getByText('3D 场景暂不可用')).toBeVisible()
  await page.getByRole('button', { name: '进入 omniAI 工作台', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('[data-view="workspace"]')).toBeVisible()
})
