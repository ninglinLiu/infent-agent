import { test, expect } from './fixtures'
import { EMPTY_ACADEMY, type AcademyState } from '../../lib/academy'
import { REPLAY_CASES } from '../../lib/academy/replay'

test('invalid historical data stays inside replay and can retry a valid file', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.route('**/api/progress', route => route.fulfill({ json: { state: { ...EMPTY_ACADEMY, name: 'Test', storyStep: 3, presentation: 'classic', reducedMotion: true } } }))
  await page.route('**/data/history/covid-2020.json', route => route.fulfill({ json: { symbol: 'SPY', dates: [], closes: [], source: 'Invalid test fixture', snapshot: '2026-01-01' } }))
  await page.goto('/dashboard?enter=academy')
  await page.getByRole('button', { name: '历史复盘', exact: true }).click()
  await page.locator('.study-case').first().click()
  await expect(page.getByText('历史数据暂时无法读取，请重试或返回案例列表。')).toBeVisible()
  await expect(page.locator('.unified-subnav')).toBeVisible()
  await page.unroute('**/data/history/covid-2020.json')
  await page.getByRole('button', { name: '重试', exact: true }).click()
  await expect(page.locator('.study-decision.ready')).toBeVisible()
  await expect(page.locator('.study-event time')).toHaveText('2020-02-28')
  expect(errors).toEqual([])
})

test('all four replays complete, save and restore after reload', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  let state: AcademyState = { ...EMPTY_ACADEMY, name: 'Test', storyStep: 3, presentation: 'classic', reducedMotion: true }
  await page.route('**/api/progress', async route => {
    if (route.request().method() === 'PATCH') state = { ...state, ...route.request().postDataJSON() }
    await route.fulfill({ json: { state } })
  })
  await page.goto('/dashboard?enter=academy')
  await page.getByRole('button', { name: '历史复盘', exact: true }).click()
  for (let index = 0; index < REPLAY_CASES.length; index++) {
    await page.locator('.study-case').nth(index).click()
    for (let decision = 0; decision < 4; decision++) {
      await expect(page.locator('.study-decision.ready')).toBeVisible()
      await page.locator('.study-actions button').nth(1).click()
    }
    await expect(page.locator('.study-result')).toBeVisible()
    await expect.poll(() => state.replays?.[REPLAY_CASES[index].id]?.decisions.length).toBe(4)
    await page.getByRole('button', { name: '看其他案例', exact: true }).click()
    await expect(page.locator('.study-case').nth(index)).toContainText('上次')
  }
  await page.goto('/dashboard?enter=academy')
  await page.getByRole('button', { name: '历史复盘', exact: true }).click()
  for (let index = 0; index < 4; index++) await expect(page.locator('.study-case').nth(index)).toContainText('上次')
  expect(errors).toEqual([])
})

test('failed history request can exit, retry and open another case', async ({ page }) => {
  await page.route('**/api/progress', route => route.fulfill({ json: { state: { ...EMPTY_ACADEMY, name: 'Test', storyStep: 3, presentation: 'classic', reducedMotion: true } } }))
  await page.route('**/data/history/covid-2020.json', route => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.goto('/dashboard?enter=academy')
  await page.getByRole('button', { name: '历史复盘', exact: true }).click()
  await page.locator('.study-case').first().click()
  await expect(page.getByText('历史数据暂时无法读取，请重试或返回案例列表。')).toBeVisible()
  await page.getByRole('button', { name: '全部案例', exact: true }).click()
  await page.locator('.study-case').nth(1).click()
  await expect(page.locator('.study-decision.ready')).toBeVisible()
  await page.getByRole('button', { name: '全部案例', exact: true }).click()
  await page.unroute('**/data/history/covid-2020.json')
  await page.locator('.study-case').first().click()
  await expect(page.locator('.study-event time')).toHaveText('2020-02-28')
})

test('animation tolerates a frame timestamp before its start time', async ({ page }) => {
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = callback => raf(timestamp => callback(timestamp - 100))
  })
  await page.route('**/api/progress', route => route.fulfill({ json: { state: { ...EMPTY_ACADEMY, name: 'Test', storyStep: 3, presentation: 'classic', reducedMotion: false } } }))
  await page.goto('/dashboard?enter=academy')
  await page.getByRole('button', { name: '历史复盘', exact: true }).click()
  await page.locator('.study-case').first().click()
  await expect(page.locator('.study-decision.ready')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.study-event time')).toHaveText('2020-02-28')
  await page.locator('.study-actions button').nth(1).click()
  await expect(page.locator('.study-decision.ready')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.study-event time')).toHaveText('2020-03-23')
})

for (const savedStep of [0, 1]) test(`onboarding skips retired mentor page from saved step ${savedStep}`, async ({ page }) => {
  let state: AcademyState = { ...EMPTY_ACADEMY, name: 'Test', storyStep: savedStep, lessonStep: 4, presentation: 'classic', reducedMotion: true }
  await page.route('**/api/progress', async route => {
    if (route.request().method() === 'PATCH') state = { ...state, ...route.request().postDataJSON() }
    await route.fulfill({ json: { state } })
  })
  await page.goto('/dashboard?enter=academy')
  if (savedStep === 0) await page.getByRole('button', { name: '接过研究员手册', exact: true }).click()
  await expect(page.getByRole('button', { name: '进入学习室', exact: true })).toBeVisible()
  await expect(page.getByText('好的直觉，', { exact: true })).toHaveCount(0)
  await expect(page.locator('.academy-story-progress small')).toHaveText('02 / 02')
  await page.getByRole('button', { name: '进入学习室', exact: true }).click()
  await expect(page.getByRole('button', { name: '历史复盘', exact: true })).toBeVisible()
  await expect.poll(() => state.storyStep).toBe(3)
  expect(state.lessonStep).toBe(4)
})
