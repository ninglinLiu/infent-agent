import test from 'node:test'
import assert from 'node:assert/strict'
import { getAcademyContent, academyDisplayName } from '../lib/academy-content'
import { readAcademy } from '../lib/academy'

test('both academy languages cover every story, lesson, and simulation step', () => {
  const zh = getAcademyContent('zh')
  const en = getAcademyContent('en')
  for (const section of ['story', 'lessons', 'simulation'] as const) {
    assert.equal(en[section].length, zh[section].length)
    en[section].forEach((step, index) => {
      assert.equal(step.mentor, zh[section][index].mentor)
      for (const value of Object.values(step)) {
        assert.ok(value.trim().length > 0)
        assert.doesNotMatch(value, /\p{Script=Han}/u)
      }
    })
  }
})

test('existing academy progress remains compatible across language selection', () => {
  const saved = { name: 'Alice 小林', storyStep: 3, lessonStep: 3, simulationStep: 2, reducedMotion: true, presentation: 'classic' }
  const state = readAcademy(JSON.stringify(saved))
  for (const lang of ['zh', 'en'] as const) {
    const content = getAcademyContent(lang)
    assert.ok(content.lessons[Math.floor(state.lessonStep / 2)])
    assert.ok(content.simulation[state.simulationStep])
    assert.equal(academyDisplayName(state.name, lang), saved.name)
  }
  assert.deepEqual(state, saved)
})

test('default researcher names translate while personal names remain untouched', () => {
  assert.equal(academyDisplayName('新晋研究员', 'en'), 'New researcher')
  assert.equal(academyDisplayName('New researcher', 'zh'), '新晋研究员')
  assert.equal(academyDisplayName('小林', 'en'), '小林')
  assert.equal(academyDisplayName('Alice', 'zh'), 'Alice')
})
