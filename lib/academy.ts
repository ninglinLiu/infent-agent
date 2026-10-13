export type MentorId = 'value' | 'quant'

export const MENTORS = {
  value: { name: '巴菲特', role: '价值投资导师', initials: 'WB', color: '#dabb7c' },
  quant: { name: '林澈', role: '量化研究专家', initials: 'LC', color: '#b2d9c8' },
} as const

export const STORY = [
  { mentor: 'value', eyebrow: '序章 · 一封邀请', title: '先认识一家企业，\n再认识它的价格。', text: '欢迎来到 omniAI 学习室。今天，你是一名新入职的研究员。我们先不急着交易，一起研究一家虚构的咖啡公司。', action: '接过研究员手册' },
  { mentor: 'quant', eyebrow: '序章 · 认识搭档', title: '好的直觉，\n也需要证据。', text: '我是林澈，你的量化搭档。价值投资提出问题，我来帮你验证。我们会先学三个小知识，再用模拟资金完成一次练习。', action: '了解今天的任务' },
  { mentor: 'value', eyebrow: '序章 · 第一天', title: '你的第一份任务：\n候鸟咖啡研究案。', text: '看懂企业、理解风险、写下规则。然后亲手下一个模拟订单，观察结果。每次只向前一步，我们一起完成。', action: '进入学习室' },
] satisfies Array<{ mentor: MentorId; eyebrow: string; title: string; text: string; action: string }>

export const LESSONS = [
  { mentor: 'value', title: '价格，不等于价值', tag: '01 / 价值投资', duration: '1 分钟', body: '价格是市场此刻给出的报价；价值是你对企业未来经营能力的判断。先了解它靠什么赚钱，再讨论这个报价是否合理。', example: '候鸟咖啡的股价下跌，并不能单独证明它变便宜了。还要看门店经营、成本和现金流是否发生变化。', question: '看到股价下跌，第一步做什么？', answer: '先检查企业经营是否发生变化', feedback: '对。价格变化是研究的起点，不是买入的充分理由。' },
  { mentor: 'quant', title: '先想清楚，能承受多少', tag: '02 / 风险意识', duration: '1 分钟', body: '再好的判断也可能出错。模拟练习开始前，先确定资金上限和复查条件，让一次错误不会用尽所有筹码。', example: '本案给你 10,000 枚模拟币，单次使用 2,000 枚。这只是固定的教学设定，不是适合每个人的仓位建议。', question: '执行前，先写下哪件事？', answer: '本次投入上限和风险复查条件', feedback: '对。先定义规则，才有办法判断后面的执行是否偏离计划。' },
  { mentor: 'quant', title: '让判断，接受检验', tag: '03 / 量化思维', duration: '1 分钟', body: '把模糊的想法写成可观察、可重复检查的条件。记录最初的判断、使用的证据和后来的结果，避免只记住成功的案例。', example: '“这家店很火”是印象；“持续观察同店销售和经营现金流”是可以检验的研究计划。一次盈利也不能证明规则有效。', question: '怎样让这次练习有复盘价值？', answer: '记录依据、规则和实际结果', feedback: '对。结果好坏都要记录，才能分清运气与可以改进的判断。' },
] satisfies Array<{ mentor: MentorId; title: string; tag: string; duration: string; body: string; example: string; question: string; answer: string; feedback: string }>

export const SIMULATION = [
  { mentor: 'value', title: '接过第一份研究案', text: '候鸟咖啡是一家虚构公司。今天不猜涨跌，先读材料：它有稳定的回头客，但原料成本正在上升。值得研究，也有需要验证的风险。', action: '记录经营与成本风险' },
  { mentor: 'quant', title: '把研究变成一条规则', text: '练习规则已经写好：用 2,000 枚模拟币，以每份 100 枚的虚构价格买入 20 份。如果后续经营假设发生变化，就重新研究。', action: '确认本次模拟计划' },
  { mentor: 'quant', title: '执行你的第一个模拟订单', text: '检查一次订单：候鸟咖啡，20 份，每份 100 模拟币。点击后只会改变这个故事里的账户，没有真实交易，也不会连接券商。', action: '模拟买入 20 份' },
  { mentor: 'value', title: '价格下跌时，回到你的依据', text: '剧情来到下一周，虚构价格从 100 降到 90。你的持仓浮亏 200 模拟币。先复查经营假设，而不是为了挽回亏损自动加仓；价格下跌本身也不能证明原判断正确。', action: '记录结果，完成复盘' },
] satisfies Array<{ mentor: MentorId; title: string; text: string; action: string }>

export const ACADEMY_STORAGE_KEY = 'infent-academy-v1'
export type AcademyState = { name: string; storyStep: number; lessonStep: number; simulationStep: number; reducedMotion: boolean; presentation: 'immersive' | 'classic' }
export const EMPTY_ACADEMY: AcademyState = { name: '', storyStep: 0, lessonStep: 0, simulationStep: 0, reducedMotion: false, presentation: 'immersive' }

export function readAcademy(raw: string | null): AcademyState {
  try {
    const data = JSON.parse(raw || '{}')
    const step = (value: unknown, max: number) => typeof value === 'number' && Number.isInteger(value) ? Math.max(0, Math.min(value, max)) : 0
    return { name: typeof data.name === 'string' ? data.name.trim().slice(0, 20) : '', storyStep: step(data.storyStep, STORY.length), lessonStep: step(data.lessonStep, LESSONS.length * 2), simulationStep: step(data.simulationStep, SIMULATION.length), reducedMotion: data.reducedMotion === true, presentation: data.presentation === 'classic' ? 'classic' : 'immersive' }
  } catch { return { ...EMPTY_ACADEMY } }
}
