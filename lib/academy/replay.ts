import { maxDrawdown } from '@/lib/quant/stats'

/**
 * 历史复盘：价格是真实的（public/data/history），节点上的事件也是真实发生过的。
 * 导师的话是教学用的提问，界面上标注为虚构对白，不是本人言论。
 */

export type Text = { zh: string; en: string }
export type ReplayAction = 'add' | 'hold' | 'trim' | 'exit'
export const REPLAY_ACTIONS: ReplayAction[] = ['add', 'hold', 'trim', 'exit']
export type ReplayRecord = { final: number; hold: number; decisions: ReplayAction[]; at: string }

export type Checkpoint = { date: string; event: Text; ask: Text }
export type ReplayCase = {
  id: string
  symbol: string
  name: Text
  period: Text
  hook: Text
  setup: Text
  checkpoints: Checkpoint[]
}

export const START_CAPITAL = 100_000
export const START_WEIGHT = 0.6

export const REPLAY_CASES: ReplayCase[] = [
  {
    id: 'covid-2020', symbol: 'SPY',
    name: { zh: '2020 疫情暴跌', en: 'The 2020 pandemic crash' },
    period: { zh: '2020 年 1 月 — 8 月', en: 'Jan — Aug 2020' },
    hook: { zh: '史上最快的一次熊市。你会在哪一天认输？', en: 'The fastest bear market on record. On which day would you give up?' },
    setup: { zh: '2020 年初，你有 10 万美元，六成买入标普 500 ETF，四成留现金。市场正在创新高。', en: 'Early 2020. You hold $100,000: 60% in an S&P 500 ETF, 40% in cash. The market is at record highs.' },
    checkpoints: [
      { date: '2020-02-28', event: { zh: '新冠疫情扩散到亚洲以外，美股经历 2008 年以来最差的一周。', en: 'COVID spreads beyond Asia. US stocks post their worst week since 2008.' }, ask: { zh: '你买它的理由变了，还是只有价格变了？', en: 'Did your reason for owning it change, or only the price?' } },
      { date: '2020-03-23', event: { zh: '三周内美股多次触发熔断。美联储当天宣布不设上限的资产购买。', en: 'Circuit breakers have tripped repeatedly in three weeks. Today the Fed announces open-ended asset purchases.' }, ask: { zh: '这时最难的问题是：手里的现金够你撑多久？', en: 'The hardest question now: how long can your cash carry you?' } },
      { date: '2020-04-30', event: { zh: '六周内超过 3000 万人申请失业救济，股价却已从低点大幅反弹。', en: 'Over 30 million jobless claims in six weeks, yet prices have rebounded sharply from the low.' }, ask: { zh: '经济数据最差的时候价格在涨。你怎么理解？', en: 'Prices rise while the data is at its worst. How do you read that?' } },
      { date: '2020-06-08', event: { zh: '标普 500 收复年内跌幅。同一天，NBER 宣布美国经济已于 2 月进入衰退。', en: 'The S&P 500 erases its 2020 loss. The same day, the NBER declares a recession began in February.' }, ask: { zh: '回本了。你现在还愿意按这个价格买入吗？', en: 'You are back to even. Would you still buy at this price?' } },
    ],
  },
  {
    id: 'hikes-2022', symbol: 'QQQ',
    name: { zh: '2022 加息熊市', en: 'The 2022 rate-hike bear' },
    period: { zh: '2021 年 11 月 — 2023 年 6 月', en: 'Nov 2021 — Jun 2023' },
    hook: { zh: '没有崩盘，只有一年慢慢地跌。这种更难熬。', en: 'No crash, just a year of grinding lower. That is harder to sit through.' },
    setup: { zh: '2021 年底，你六成仓位在纳指 100 ETF，科技股刚走完两年大牛市。', en: 'Late 2021. You hold 60% in a Nasdaq-100 ETF after a two-year tech bull run.' },
    checkpoints: [
      { date: '2022-01-26', event: { zh: '美联储表示很快将适合加息。纳指已从高点明显回落。', en: 'The Fed says it will soon be appropriate to raise rates. The Nasdaq is already well off its high.' }, ask: { zh: '利率上升，对未来才赚钱的公司意味着什么？', en: 'What do rising rates mean for companies whose profits lie far ahead?' } },
      { date: '2022-06-16', event: { zh: '美联储前一天加息 75 个基点，是 1994 年以来最大的单次加息。', en: 'Yesterday the Fed hiked 75 basis points, the largest single move since 1994.' }, ask: { zh: '已经跌了不少。便宜和继续下跌，你靠什么区分？', en: 'It has fallen a lot. How do you tell cheap from still falling?' } },
      { date: '2022-10-13', event: { zh: '9 月 CPI 同比 8.2%，核心通胀创 40 年新高。', en: 'September CPI comes in at 8.2% with core inflation at a 40-year high.' }, ask: { zh: '消息这么差。市场的价格里已经包含了多少？', en: 'The news is this bad. How much of it is already in the price?' } },
      { date: '2023-02-01', event: { zh: '美联储把加息幅度放缓到 25 个基点。', en: 'The Fed slows its hikes to 25 basis points.' }, ask: { zh: '等到一切明朗再买，通常要付出什么代价？', en: 'What does waiting for clarity usually cost?' } },
    ],
  },
  {
    id: 'gfc-2008', symbol: 'SPY',
    name: { zh: '2008 金融危机', en: 'The 2008 financial crisis' },
    period: { zh: '2008 年 8 月 — 2009 年 12 月', en: 'Aug 2008 — Dec 2009' },
    hook: { zh: '银行一家家倒下的时候，你还敢不敢持有？', en: 'When banks are failing one by one, would you still hold?' },
    setup: { zh: '2008 年夏天，你六成仓位在标普 500 ETF。次贷问题已经吵了一年，但指数还没有崩。', en: 'Summer 2008. You hold 60% in an S&P 500 ETF. Subprime has been in the news for a year, but the index has not collapsed.' },
    checkpoints: [
      { date: '2008-09-15', event: { zh: '雷曼兄弟申请破产，美林接受美国银行收购。', en: 'Lehman Brothers files for bankruptcy. Merrill Lynch agrees to a sale to Bank of America.' }, ask: { zh: '如果银行系统真的出事，你的现金放在哪里才安全？', en: 'If the banking system truly breaks, where is your cash safe?' } },
      { date: '2008-10-17', event: { zh: '美股刚经历极端动荡的一个月。巴菲特在《纽约时报》撰文，说他正在买入美国股票。', en: 'US stocks have just had a month of extreme turmoil. Buffett writes in The New York Times that he is buying American stocks.' }, ask: { zh: '别人说他在买，不等于你也该买。你的依据是什么？', en: 'Someone else buying is not your reason. What is yours?' } },
      { date: '2009-03-09', event: { zh: '花旗股价几天前跌破 1 美元，市场几乎看不到买家。', en: 'Citigroup fell below $1 days ago. Buyers are nowhere to be seen.' }, ask: { zh: '这是你最害怕的一天。你事先写好的规则是什么？', en: 'This is the day you fear most. What rule did you write in advance?' } },
      { date: '2009-06-01', event: { zh: '通用汽车申请破产保护，而股市已从 3 月低点反弹约四成。', en: 'General Motors files for bankruptcy, while stocks are up about 40% from the March low.' }, ask: { zh: '坏消息还在出，价格却走在前面。你要追吗？', en: 'Bad news keeps coming while prices run ahead. Do you chase?' } },
    ],
  },
  {
    id: 'ko-1998', symbol: 'KO',
    name: { zh: '可口可乐 1998', en: 'Coca-Cola 1998' },
    period: { zh: '1998 年 — 2003 年', en: '1998 — 2003' },
    hook: { zh: '世界上最好的生意之一，买贵了会怎样？', en: 'One of the best businesses in the world. What happens if you overpay?' },
    setup: { zh: '1998 年初，你六成仓位在可口可乐。这是巴菲特最有名的持仓之一，生意几乎无可挑剔。', en: 'Early 1998. You hold 60% in Coca-Cola, one of Buffett’s best-known holdings and a nearly flawless business.' },
    checkpoints: [
      { date: '1998-07-16', event: { zh: '股价接近历史高点，市盈率约 50 倍。所有人都知道这是好公司。', en: 'The stock is near its all-time high at about 50 times earnings. Everyone knows it is a great company.' }, ask: { zh: '好公司和好价格，是两件事。你现在在为哪一个付钱？', en: 'A great company and a great price are two things. Which are you paying for?' } },
      { date: '1999-06-17', event: { zh: '比利时和法国发生饮料污染事件，产品被大规模召回。', en: 'A contamination scare in Belgium and France triggers a large product recall.' }, ask: { zh: '这是暂时的麻烦，还是护城河出了问题？', en: 'Is this temporary trouble, or a crack in the moat?' } },
      { date: '2000-02-03', event: { zh: 'CEO 在 1999 年底宣布辞任，公司随后宣布裁员约 6000 人。', en: 'The CEO announced his departure in late 1999, and the company then announced about 6,000 job cuts.' }, ask: { zh: '两年了股价还在跌，生意却没有消失。你还信最初的判断吗？', en: 'Two years of falling prices, yet the business is still there. Do you still trust your first call?' } },
      { date: '2002-07-25', event: { zh: '科网泡沫破裂后美股持续下跌。可口可乐仍在赚钱，股价却依然低迷。', en: 'US stocks keep sliding after the dot-com bust. Coca-Cola still earns money, but the stock stays depressed.' }, ask: { zh: '如果再持有五年也不涨，你还能接受吗？', en: 'If it does not rise for five more years, could you live with that?' } },
    ],
  },
]

export type Series = { symbol: string; dates: string[]; closes: number[]; source: string; snapshot: string }
export type Position = { cash: number; shares: number }

export function checkpointIndexes(series: Pick<Series, 'dates'>, checkpoints: Checkpoint[]) {
  return checkpoints.map(cp => {
    const i = series.dates.findIndex(date => date >= cp.date)
    return i < 0 ? series.dates.length - 1 : i
  })
}

export function openPosition(price: number): Position {
  return { cash: START_CAPITAL * (1 - START_WEIGHT), shares: (START_CAPITAL * START_WEIGHT) / price }
}

/** 加仓用一半现金，减仓卖一半，清仓全卖。复盘不计交易成本，专注决策本身。 */
export function applyAction(position: Position, action: ReplayAction, price: number): Position {
  if (action === 'add') { const spend = position.cash / 2; return { cash: position.cash - spend, shares: position.shares + spend / price } }
  if (action === 'trim') { const sold = position.shares / 2; return { cash: position.cash + sold * price, shares: position.shares - sold } }
  if (action === 'exit') return { cash: position.cash + position.shares * price, shares: 0 }
  return position
}

/** 按决策序列计算到 upto（含）为止的账户净值和当前仓位。 */
export function simulate(series: Pick<Series, 'closes'>, points: number[], actions: ReplayAction[], upto = series.closes.length - 1) {
  let position = openPosition(series.closes[0])
  const values: number[] = []
  for (let t = 0; t <= upto; t++) {
    const k = points.indexOf(t)
    if (k >= 0 && k < actions.length) position = applyAction(position, actions[k], series.closes[t])
    values.push(position.cash + position.shares * series.closes[t])
  }
  return { values, position }
}

export function replayResult(series: Pick<Series, 'closes'>, points: number[], actions: ReplayAction[]) {
  const { values } = simulate(series, points, actions)
  const hold = simulate(series, points, []).values
  const closes = series.closes
  const allIn = (START_CAPITAL * closes[closes.length - 1]) / closes[0]
  return {
    final: values[values.length - 1],
    hold: hold[hold.length - 1],
    allIn,
    assetReturn: closes[closes.length - 1] / closes[0] - 1,
    maxDrawdown: maxDrawdown(values).value,
    holdDrawdown: maxDrawdown(hold).value,
  }
}

export function verdict(result: ReturnType<typeof replayResult>, actions: ReplayAction[], lang: 'zh' | 'en') {
  const zh = lang !== 'en'
  const gap = result.final - result.hold
  const traded = actions.some(action => action !== 'hold')
  const calmer = result.maxDrawdown > result.holdDrawdown + 0.01
  const rougher = result.maxDrawdown < result.holdDrawdown - 0.01
  if (!traded) return zh ? '你一直没动。什么都不做也是决定，而且要忍受全部波动。关键是：当时的你，是想清楚了才不动，还是不敢动？' : 'You never traded. Doing nothing is a decision too, and it means sitting through every swing. Did you hold because you had thought it through, or because you froze?'
  if (gap > 0 && calmer) return zh ? '你比一直持有赚得多，回撤也更小。先别急着高兴：一次结果证明不了方法。写下当时的理由，下次换一段历史再验证。' : 'You beat holding with a smaller drawdown. Do not celebrate yet: one outcome does not prove a method. Write down your reasons and test them on another period.'
  if (gap > 0 && rougher) return zh ? '你赚得比一直持有多，但过程也更颠簸。问问自己：下一次同样的回撤，你还扛得住吗？' : 'You made more than holding, but the ride was rougher. Could you sit through the same drawdown next time?'
  if (gap > 0) return zh ? '你比一直持有多赚了一些，回撤差不多。这是判断对了，还是运气好？写下当时的依据，换一段历史再试一次。' : 'You made a bit more than holding, with a similar drawdown. Was that judgment or luck? Write down your reasons and try another period.'
  if (calmer) return zh ? '你少赚了一些，换来更小的回撤。这不一定是错：如果它让你留在市场里，这笔钱可能花得值。' : 'You gave up some return for a smaller drawdown. That is not necessarily wrong: if it keeps you in the game, it may be money well spent.'
  return zh ? '这次操作没有跑赢一直持有，回撤也没有变小。看看你在哪个节点改了主意：当时是依据变了，还是只是价格让你害怕？' : 'This run neither beat holding nor reduced the drawdown. Find where you changed your mind: did the evidence change, or did the price scare you?'
}

export const ACTION_LABEL: Record<ReplayAction, { title: Text; note: Text }> = {
  add: { title: { zh: '加仓', en: 'Add' }, note: { zh: '用一半现金买入', en: 'Buy with half your cash' } },
  hold: { title: { zh: '不动', en: 'Hold' }, note: { zh: '维持当前仓位', en: 'Keep the position' } },
  trim: { title: { zh: '减仓', en: 'Trim' }, note: { zh: '卖出一半持仓', en: 'Sell half' } },
  exit: { title: { zh: '清仓', en: 'Exit' }, note: { zh: '全部换成现金', en: 'Go to cash' } },
}
