import type { Attempt, ChoiceEvent, CourseContent, LocalText } from './learning'

export function comicChoices(content: CourseContent | undefined, attempt: Attempt | undefined) {
  const scene = content?.scenes[(attempt?.scene ?? 1) - 1]
  if (attempt?.script_version === 'v2' && attempt.scene === 3 && attempt.shares === 0) return scene?.cashChoices ?? []
  return scene?.choices ?? []
}

export function comicEnding(choices: ChoiceEvent[]): { title: LocalText; text: LocalText } {
  const actions = new Set(choices.map(choice => choice.action))
  if (actions.has('reduce_exposure')) return {
    title: { zh: '结局：退出之后，仍然需要复盘', en: 'An exit still deserves a review' },
    text: { zh: '你先建仓，后在79.50退出，最终保留9,180现金，已实现亏损820。后续上涨没有改变当时的交易记录。需要复盘的是：退出对应了什么风险或资金约束，下次遇到类似情况时，你会怎样提前定义条件？', en: 'You entered, then exited at 79.50, leaving 9,180 cash and a realised loss of 820. The later rise does not rewrite that decision. Review which risk or capital constraint justified the exit and how you would define that condition in advance next time.' },
  }
  if (actions.has('enter_pullback')) return {
    title: { zh: '结局：等待后，你重新投入了资金', en: 'You waited, then committed capital' },
    text: { zh: '你没有在100建仓，而是在79.50买入40份；终值为14,580，其中现金6,820、持仓价值7,760（若终局卖出，则全部转为现金）。这条预设路径有利于较晚买入者，但不能由此推出“等下跌再买”在其他情形中也有效。请检验买入依据，而不只比较入场价格。', en: 'You bought 40 shares at 79.50 instead of entering at 100. Final value is 14,580: 6,820 cash plus 7,760 of shares, or all cash if you chose to exit. This designed path favours the later entry; it does not establish that waiting for a decline works elsewhere. Review the evidence, not only the entry price.' },
  }
  if (actions.has('buy_40')) return {
    title: { zh: '结局：承受波动，走完这次观察', en: 'You carried the position through the drawdown' },
    text: { zh: '你以100买入40份，在下跌时保留持仓，终值为13,760。终局保留持仓时，3,760属于浮盈；若卖出，则转为已实现收益。这个结果依赖本案例给定的经营改善与价格路径，并不证明任何一次坚持都值得。复盘应保留：当时为什么继续持有，以及什么证据会让你退出。', en: 'You bought 40 shares at 100 and retained them through the decline, ending with 13,760. The 3,760 gain is unrealised if you kept the shares and realised if you sold. This outcome depends on the exercise assumptions; persistence alone is not validated. Keep the reasons for holding and the evidence that would have prompted an exit.' },
  }
  return {
    title: { zh: '结局：现金没有波动，机会也有成本', en: 'Cash avoided exposure but carried an opportunity cost' },
    text: { zh: '你在整条路径中保留了10,000现金，没有交易盈亏，也没有参与后来的上涨。观望并不需要为事后的价格辩解，但需要一个后续计划：什么信息足以支持行动？如果条件始终不满足，是否应把时间和资金用于其他研究对象？', en: 'You retained 10,000 cash, with no trading P&L and no participation in the later rise. Waiting does not need justification by hindsight, but it does need a next step: what evidence would support action, and when would you direct your research and capital elsewhere?' },
  }
}
