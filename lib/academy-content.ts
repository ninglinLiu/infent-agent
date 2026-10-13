import { MENTORS, STORY, LESSONS, SIMULATION } from './academy'

// Content changes language; progress continues to use the same stable step indexes.
const EN = {
  mentors: {
    value: { ...MENTORS.value, name: 'Warren Buffett', role: 'Value investing mentor' },
    quant: { ...MENTORS.quant, name: 'Lin Che', role: 'Quant research mentor' },
  },
  story: [
    { mentor: 'value', eyebrow: 'Prologue · An invitation', title: 'Know the business.\nThen look at its price.', text: 'Welcome to the omniAI study room. Today is your first day as a researcher. Before making a trade, let’s study a fictional coffee company together.', action: 'Take the researcher’s handbook' },
    { mentor: 'quant', eyebrow: 'Prologue · Meet your partner', title: 'Good intuition\nneeds evidence, too.', text: 'I’m Lin Che, your quant research partner. Value investing asks the questions; I help test them. We’ll take three short lessons, then practise with simulated funds.', action: 'Explore today’s assignment' },
    { mentor: 'value', eyebrow: 'Prologue · Day one', title: 'Your first assignment:\nMigratory Coffee.', text: 'Understand the business, consider the risks, and write down your rules. Then place a simulated order and observe the result. We’ll take it one step at a time.', action: 'Enter the study room' },
  ],
  lessons: [
    { mentor: 'value', title: 'Price is not value', tag: '01 / VALUE INVESTING', duration: '1 minute', body: 'Price is what the market quotes right now. Value is your assessment of a business’s future earning ability. Understand how it makes money before deciding whether the quote is reasonable.', example: 'A fall in Migratory Coffee’s share price does not prove it is a bargain. You also need to examine its stores, costs, and cash flow.', question: 'When a share price falls, what comes first?', answer: 'Check whether the business has changed', feedback: 'Exactly. A price change is a starting point for research, not enough reason to buy.' },
    { mentor: 'quant', title: 'Know how much you can risk', tag: '02 / RISK AWARENESS', duration: '1 minute', body: 'Even a good judgment can be wrong. Before this exercise, set a spending limit and conditions for reviewing your assumptions, so one mistake cannot use all your funds.', example: 'This case gives you 10,000 simulated credits and uses 2,000 for one order. These are fixed teaching inputs, not a position size recommendation for everyone.', question: 'What should you write down before acting?', answer: 'The spending limit and risk review conditions', feedback: 'Exactly. Define the rules first so you can later check whether you followed the plan.' },
    { mentor: 'quant', title: 'Make your judgment testable', tag: '03 / QUANT THINKING', duration: '1 minute', body: 'Turn vague ideas into observable conditions you can check repeatedly. Record your initial judgment, the evidence, and the outcome so you do not remember only the successes.', example: '“This café is popular” is an impression. “Track same-store sales and operating cash flow” is a testable research plan. One profitable trade cannot prove a rule works.', question: 'How can you make this exercise worth reviewing?', answer: 'Record the evidence, rules, and actual outcome', feedback: 'Exactly. Record good and bad outcomes to distinguish luck from judgments you can improve.' },
  ],
  simulation: [
    { mentor: 'value', title: 'Take your first research case', text: 'Migratory Coffee is fictional. Today, start with the evidence instead of guessing price moves: it has loyal customers, but ingredient costs are rising. There are opportunities to research and risks to test.', action: 'Record the business and cost risks' },
    { mentor: 'quant', title: 'Turn research into a rule', text: 'The exercise has a fixed plan: spend 2,000 simulated credits on 20 shares at a fictional price of 100 each. Revisit the research if the business assumptions change.', action: 'Confirm the simulated plan' },
    { mentor: 'quant', title: 'Place your first simulated order', text: 'Review the order: Migratory Coffee, 20 shares at 100 simulated credits each. Clicking changes only this story’s account. There is no real trade or broker connection.', action: 'Simulate buying 20 shares' },
    { mentor: 'value', title: 'When the price falls, revisit your evidence', text: 'A week passes in the story. The fictional price falls from 100 to 90, leaving an unrealised loss of 200 simulated credits. Recheck the business assumptions rather than automatically adding to recover the loss. A lower price alone does not validate your original judgment.', action: 'Record the outcome and review' },
  ],
} satisfies {
  mentors: Record<keyof typeof MENTORS, { name: string; role: string; initials: string; color: string }>
  story: typeof STORY
  lessons: typeof LESSONS
  simulation: typeof SIMULATION
}

export function getAcademyContent(lang: 'zh' | 'en') {
  return lang === 'en' ? EN : { mentors: MENTORS, story: STORY, lessons: LESSONS, simulation: SIMULATION }
}

export function academyDisplayName(name: string, lang: 'zh' | 'en') {
  return !name || name === '新晋研究员' || name === 'New researcher'
    ? lang === 'en' ? 'New researcher' : '新晋研究员'
    : name
}
