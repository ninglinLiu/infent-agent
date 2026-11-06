"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, X } from 'lucide-react'
import { useHistoryFile } from '@/lib/academy/use-history'
import { afterBuying, assetRisk, correlationIn, maxPosition, mixStats, recoveryNeeded, yearSlice, type LessonData } from '@/lib/academy/lesson-math'
import { useView } from '@/components/dash/view-context'
import { useAcademy } from './AcademyProvider'
import { useAcademyLocale } from './useAcademyLocale'
import { HistoryChart } from './HistoryChart'
import { StudyMentor } from './ReplayView'

const pct = (value: number, digits = 1) => `${value > 0 ? '+' : ''}${(value * 100).toFixed(digits)}%`
const plain = (value: number, digits = 0) => `${(Math.abs(value) * 100).toFixed(digits)}%`

type Quiz = { question: string; options: Array<{ text: string; right?: boolean; why: string }> }

function QuizBlock({ quiz, onPassed, passed }: { quiz: Quiz; onPassed: () => void; passed: boolean }) {
  const { tr } = useAcademyLocale()
  const [picked, setPicked] = useState<number | null>(null)
  const choice = picked === null ? null : quiz.options[picked]
  return <section className="study-quiz">
    <h3>{quiz.question}</h3>
    <div className="study-options">{quiz.options.map((option, i) => {
      const state = picked !== i ? '' : option.right ? 'right' : 'wrong'
      return <button type="button" key={option.text} className={state} disabled={passed} onClick={() => { setPicked(i); if (option.right) onPassed() }}>
        <span>{'ABCD'[i]}</span>{option.text}{state === 'right' ? <Check size={16} /> : state === 'wrong' ? <X size={16} /> : null}
      </button>
    })}</div>
    {choice && <p className={`study-why ${choice.right ? 'right' : 'wrong'}`} role="status"><b>{choice.right ? tr('对。', 'Right. ') : tr('再想想。', 'Not quite. ')}</b>{choice.why}</p>}
  </section>
}

function DrawdownLesson({ data, onPassed, passed }: { data: LessonData; onPassed: () => void; passed: boolean }) {
  const { tr } = useAcademyLocale()
  const [from, to] = yearSlice(data.dates, '2020')
  const dates = data.dates.slice(from, to), closes = data.series.SPY.slice(from, to)
  const peak = closes.indexOf(Math.max(...closes.slice(0, 60)))
  const [buy, setBuy] = useState(peak)
  const stats = afterBuying(closes, buy)
  const crash = assetRisk(closes.slice(0, 80))
  const crashPct = plain(crash.maxDrawdown)
  const need = recoveryNeeded(crash.maxDrawdown)
  const quiz: Quiz = {
    question: tr(`SPY 在 2020 年 3 月最深回撤约 ${crashPct}。要回到高点，需要从低点涨多少？`, `SPY fell about ${crashPct} at the March 2020 low. How much must it rise from the low to get back to the high?`),
    options: [
      { text: tr(`约 ${crashPct}，跌多少涨多少`, `About ${crashPct}, the same as the fall`), why: tr('基数变小了。跌完之后本金更少，同样的百分比赚回来的钱更少。', 'The base shrank. After the fall there is less capital, so the same percentage earns back less.') },
      { text: tr(`约 ${plain(need)}`, `About ${plain(need)}`), right: true, why: tr(`1 ÷ (1 − ${crashPct}) − 1 ≈ ${plain(need)}。回撤越深，回本越难，这就是控制回撤比追求收益更优先的原因。`, `1 ÷ (1 − ${crashPct}) − 1 ≈ ${plain(need)}. The deeper the fall, the harder the way back, which is why drawdown control comes first.`) },
      { text: tr('不用涨，分红会补回来', 'None, dividends make up for it'), why: tr('这里用的就是含分红的复权价，分红补不回这么大的跌幅。', 'These adjusted prices already include dividends. They do not cover a fall this large.') },
    ],
  }
  return <>
    <p className="study-lead">{tr('买入之后最多会浮亏多少？这个数字比预期收益更重要。拖动滑块，换一个 2020 年的买入日试试。', 'How far could you be under water after buying? That number matters more than the expected return. Drag to pick a different buy date in 2020.')}</p>
    <div className="study-chart-card">
      <HistoryChart dates={dates} values={closes} markers={[{ index: buy, label: tr('买入', 'Buy'), tone: 'buy' }, ...(stats.worst < 0 ? [{ index: stats.worstAt, label: pct(stats.worst), tone: 'low' as const }] : [])]} band={stats.worst < 0 ? [buy, stats.worstAt] : undefined} ariaLabel={tr('SPY 2020 年真实走势', 'SPY real prices in 2020')} height={270} />
      <label className="study-slider"><span>{tr('买入日', 'Buy date')} <b>{dates[buy]}</b></span><input type="range" min={0} max={dates.length - 2} value={buy} onChange={e => setBuy(Number(e.target.value))} /></label>
      <dl className="study-account">
        <div><dt>{tr('买入后最大浮亏', 'Worst paper loss')}</dt><dd className={stats.worst < 0 ? 'down' : ''}>{stats.worst < 0 ? pct(stats.worst) : tr('没有浮亏', 'None')}</dd></div>
        <div><dt>{tr('最深的一天', 'Deepest day')}</dt><dd>{stats.worst < 0 ? dates[stats.worstAt] : '—'}</dd></div>
        <div><dt>{tr('回本等了', 'Time to recover')}</dt><dd>{stats.worst >= 0 ? '—' : stats.recoveredAt === null ? tr('当年未回本', 'Not within 2020') : tr(`${stats.recoveredAt - buy} 个交易日`, `${stats.recoveredAt - buy} trading days`)}</dd></div>
        <div><dt>{tr('需要反弹', 'Rebound needed')}</dt><dd>{stats.worst < 0 ? pct(recoveryNeeded(stats.worst)) : '—'}</dd></div>
      </dl>
    </div>
    <QuizBlock quiz={quiz} onPassed={onPassed} passed={passed} />
  </>
}

const ASSETS = ['SPY', 'QQQ', 'NVDA', 'GLD', 'TLT']

function SizingLesson({ data, onPassed, passed }: { data: LessonData; onPassed: () => void; passed: boolean }) {
  const { tr } = useAcademyLocale()
  const [symbol, setSymbol] = useState('NVDA')
  const [position, setPosition] = useState(50)
  const risk = useMemo(() => assetRisk(data.series[symbol]), [data, symbol])
  const loss = (position / 100) * risk.maxDrawdown
  const safe = maxPosition(0.15, risk.maxDrawdown)
  const nvda = assetRisk(data.series.NVDA)
  const nvdaSafe = maxPosition(0.15, nvda.maxDrawdown)
  const quiz: Quiz = {
    question: tr(`你的账户最多只能亏 15%。NVDA 这五年最大回撤 ${plain(nvda.maxDrawdown)}，按最坏情况，最多放多少仓位？`, `Your account can lose at most 15%. NVDA’s worst drawdown in these five years was ${plain(nvda.maxDrawdown)}. In the worst case, what is the largest position?`),
    options: [
      { text: tr('50%，好公司可以重仓', '50%, great companies deserve size'), why: tr(`50% 的仓位遇到 ${plain(nvda.maxDrawdown)} 的回撤，账户要亏 ${plain(0.5 * nvda.maxDrawdown)}，已经超过你的底线。`, `A 50% position in a ${plain(nvda.maxDrawdown)} drawdown costs the account ${plain(0.5 * nvda.maxDrawdown)}, beyond your limit.`) },
      { text: tr(`约 ${plain(nvdaSafe)}`, `About ${plain(nvdaSafe)}`), right: true, why: tr(`15% ÷ ${plain(nvda.maxDrawdown)} ≈ ${plain(nvdaSafe)}。仓位不是看你多看好，而是看最坏时你亏不亏得起。历史最坏也不是未来的上限。`, `15% ÷ ${plain(nvda.maxDrawdown)} ≈ ${plain(nvdaSafe)}. Size follows what you can afford to lose, not how much you like it. And the historical worst is not a ceiling for the future.`) },
      { text: tr('100%，长期总会涨回来', '100%, it always comes back eventually'), why: tr('回来之前账户可能先腰斩。多数人不是看错方向，而是扛不住中途的亏损。', 'The account may halve first. Most people are not wrong on direction; they cannot sit through the loss on the way.') },
    ],
  }
  return <>
    <p className="study-lead">{tr('仓位决定你能不能活到看对的那天。选一个标的，调仓位，看 2020—2024 年真实最大回撤会让账户亏多少。', 'Position size decides whether you survive to be right. Pick an asset, set a size, and see what its real 2020—2024 worst drawdown does to the account.')}</p>
    <div className="study-chart-card">
      <div className="study-chips" role="group" aria-label={tr('选择标的', 'Choose asset')}>{ASSETS.map(s => <button type="button" key={s} aria-pressed={s === symbol} onClick={() => setSymbol(s)}>{s}</button>)}</div>
      <HistoryChart dates={data.dates} values={data.series[symbol]} band={[risk.from, risk.to]} ariaLabel={tr(`${symbol} 2020 到 2024 年真实走势`, `${symbol} real prices 2020 to 2024`)} height={230} />
      <label className="study-slider"><span>{tr('仓位', 'Position')} <b>{position}%</b></span><input type="range" min={5} max={100} step={5} value={position} onChange={e => setPosition(Number(e.target.value))} /></label>
      <div className="study-meter" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.abs(loss) / 0.5 * 100)}%` }} className={Math.abs(loss) > 0.15 ? 'over' : ''} /><b style={{ left: '30%' }} /></div>
      <dl className="study-account">
        <div><dt>{tr('最大回撤', 'Max drawdown')}</dt><dd className="down">{pct(risk.maxDrawdown)}</dd></div>
        <div><dt>{tr('账户最多亏', 'Account loss')}</dt><dd className={Math.abs(loss) > 0.15 ? 'down' : ''}>{pct(loss)}</dd></div>
        <div><dt>{tr('亏 15% 对应仓位', 'Size for a 15% limit')}</dt><dd>{plain(safe)}</dd></div>
        <div><dt>{tr('五年总收益', 'Five-year return')}</dt><dd>{pct(risk.totalReturn, 0)}</dd></div>
      </dl>
    </div>
    <QuizBlock quiz={quiz} onPassed={onPassed} passed={passed} />
  </>
}

function MixLesson({ data, onPassed, passed }: { data: LessonData; onPassed: () => void; passed: boolean }) {
  const { tr } = useAcademyLocale()
  const [hedge, setHedge] = useState<'TLT' | 'GLD'>('TLT')
  const [weight, setWeight] = useState(60)
  const { QQQ } = data.series
  const mix = useMemo(() => mixStats(QQQ, data.series[hedge], weight / 100), [QQQ, data, hedge, weight])
  const alone = useMemo(() => mixStats(QQQ, QQQ, 1), [QQQ])
  const all = correlationIn(data.dates, QQQ, data.series[hedge])
  const in2022 = correlationIn(data.dates, QQQ, data.series[hedge], '2022')
  const tlt2022 = correlationIn(data.dates, QQQ, data.series.TLT, '2022')
  const [y0, y1] = yearSlice(data.dates, '2022')
  const quiz: Quiz = {
    question: tr(`2022 年 QQQ 和长债 TLT 的日收益相关系数是 ${tlt2022.toFixed(2)}。这说明什么？`, `In 2022 the daily correlation between QQQ and long bonds (TLT) was ${tlt2022.toFixed(2)}. What does that tell you?`),
    options: [
      { text: tr('股债总能互相对冲，放心配', 'Stocks and bonds always hedge each other'), why: tr('相关性不是常数。加息时利率同时打压股票估值和债券价格，两边一起跌。', 'Correlation is not a constant. Rate hikes hit stock valuations and bond prices at once, so both fell.') },
      { text: tr('分散的效果取决于下跌的原因，要看相关性会不会变', 'Diversification depends on why markets fall; correlation can change'), right: true, why: tr('分散不是多买几个品种，而是买在不同情景下表现不同的东西。回测里好用的对冲，换一种危机可能失效。', 'Diversifying is not owning more things; it is owning things that behave differently across scenarios. A hedge that worked in a backtest may fail in the next kind of crisis.') },
      { text: tr('应该全部换成现金', 'You should move everything to cash'), why: tr('现金也有成本。这个数字告诉你的是对冲会失效，不是一定要离场。', 'Cash has a cost too. The number says a hedge can fail, not that you must leave the market.') },
    ],
  }
  return <>
    <p className="study-lead">{tr('分散是唯一的免费午餐，前提是它们真的不同步。调整 QQQ 和对冲资产的比例，看真实回撤怎么变，再看看 2022 年发生了什么。', 'Diversification is the one free lunch, if the assets really move differently. Adjust the mix, watch the real drawdown change, then look at what happened in 2022.')}</p>
    <div className="study-chart-card">
      <div className="study-chips" role="group" aria-label={tr('对冲资产', 'Hedge asset')}>{(['TLT', 'GLD'] as const).map(s => <button type="button" key={s} aria-pressed={s === hedge} onClick={() => setHedge(s)}>{s === 'TLT' ? tr('长债 TLT', 'Bonds TLT') : tr('黄金 GLD', 'Gold GLD')}</button>)}</div>
      <HistoryChart dates={data.dates} values={mix.curve} overlay={alone.curve} band={[y0, y1 - 1]} format={v => v.toFixed(0)} ariaLabel={tr('组合与 QQQ 的真实净值对比', 'Mix versus QQQ on real prices')} height={230} />
      <div className="study-legend"><span><i />{tr('组合', 'Mix')}</span><span><i className="overlay" />{tr('纯 QQQ', 'QQQ only')}</span><span><i className="band" />2022</span></div>
      <label className="study-slider"><span>QQQ <b>{weight}%</b> / {hedge} <b>{100 - weight}%</b></span><input type="range" min={0} max={100} step={5} value={weight} onChange={e => setWeight(Number(e.target.value))} /></label>
      <dl className="study-account">
        <div><dt>{tr('组合最大回撤', 'Mix max drawdown')}</dt><dd className="down">{pct(mix.maxDrawdown)}</dd></div>
        <div><dt>{tr('纯 QQQ 回撤', 'QQQ drawdown')}</dt><dd className="down">{pct(alone.maxDrawdown)}</dd></div>
        <div><dt>{tr('五年相关系数', 'Five-year corr.')}</dt><dd>{all.toFixed(2)}</dd></div>
        <div><dt>{tr('2022 年相关系数', '2022 corr.')}</dt><dd>{in2022.toFixed(2)}</dd></div>
      </dl>
    </div>
    <QuizBlock quiz={quiz} onPassed={onPassed} passed={passed} />
  </>
}

export function DataLessonsView() {
  const { state, update } = useAcademy()
  const { setView } = useView()
  const { tr } = useAcademyLocale()
  const { data, failed, retry } = useHistoryFile<LessonData>('lessons')
  const heading = useRef<HTMLHeadingElement>(null)
  // 进度沿用 lessonStep：每节两步（学习 → 答对），已有用户的进度保持有效
  const index = Math.min(Math.floor(state.lessonStep / 2), 2)
  const complete = state.lessonStep >= 6
  const [viewing, setViewing] = useState(index)
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [viewing])
  const lessons = [
    { mentor: 'value' as const, title: tr('回撤：你真正要承受的数字', 'Drawdown: the number you actually live through'), say: tr('别先问能赚多少。先问买完之后，你可能要看着账户亏多少，还能不能睡得着。', 'Do not start with how much you can make. Start with how much you may watch the account lose, and whether you can still sleep.') },
    { mentor: 'quant' as const, title: tr('仓位：决定你能不能活下来', 'Position size: whether you survive'), say: tr('把「我很看好」换成一个算式：能承受的亏损除以最大回撤，就是仓位的上限。', 'Replace “I really like it” with arithmetic: the loss you can bear divided by the maximum drawdown is your position ceiling.') },
    { mentor: 'quant' as const, title: tr('分散：要看相关性，不是看数量', 'Diversification: correlation, not count'), say: tr('买五只一起涨跌的股票不算分散。用数据看它们什么时候同步，尤其是坏的时候。', 'Five stocks that move together are not diversified. Use data to see when they move in step, especially in bad times.') },
  ]
  const lesson = lessons[viewing]
  const passed = state.lessonStep >= (viewing + 1) * 2
  const markPassed = () => { if (!passed) update({ lessonStep: (viewing + 1) * 2 }) }

  return <div className="study-page">
    <header className="study-intro compact"><h1>{tr('三节短课，都用真实行情来算。', 'Three short lessons, all on real prices.')}</h1><p>{tr('学完就是 Agent 策略书上的那几个参数：回撤、仓位、对冲。', 'They are the parameters on the agent’s strategy card: drawdown, position size and hedges.')}</p></header>
    <nav className="study-tabs" aria-label={tr('课程', 'Lessons')}>{lessons.map((item, i) => {
      const locked = !complete && i > index
      const done = state.lessonStep >= (i + 1) * 2
      return <button type="button" key={item.title} aria-current={viewing === i ? 'step' : undefined} disabled={locked} onClick={() => setViewing(i)}><span className={done ? 'done' : ''}>{done ? <Check size={13} /> : i + 1}</span>{item.title}</button>
    })}</nav>
    <div className="study-player-grid">
      <div className="study-main">
        <h2 ref={heading} tabIndex={-1} className="study-lesson-title">{lesson.title}</h2>
        {failed && <div className="study-empty"><p>{tr('行情数据加载失败。', 'Could not load market data.')}</p><button type="button" className="study-btn" onClick={retry}>{tr('重试', 'Retry')}</button></div>}
        {!data && !failed && <div className="study-empty" role="status">{tr('正在读取真实行情…', 'Loading real prices…')}</div>}
        {data && viewing === 0 && <DrawdownLesson key="a" data={data} onPassed={markPassed} passed={passed} />}
        {data && viewing === 1 && <SizingLesson key="b" data={data} onPassed={markPassed} passed={passed} />}
        {data && viewing === 2 && <MixLesson key="c" data={data} onPassed={markPassed} passed={passed} />}
        {passed && <div className="study-next">{viewing < 2
          ? <button type="button" className="study-btn primary" onClick={() => setViewing(viewing + 1)}>{tr('下一节', 'Next lesson')}<ArrowRight size={15} /></button>
          : <button type="button" className="study-btn primary" onClick={() => setView('simulation')}>{tr('带着这三个问题，去走一段真实历史', 'Take these into a real historical replay')}<ArrowRight size={15} /></button>}</div>}
        {data && <p className="study-source">{tr(`价格：${data.source}，快照 ${data.snapshot}。历史数据，不代表未来。`, `Prices: ${data.source}, snapshot ${data.snapshot}. Historical, not a forecast.`)}</p>}
      </div>
      <StudyMentor key={lesson.mentor} mentor={lesson.mentor} label={tr('带你看', 'Your guide')} text={lesson.say} />
    </div>
  </div>
}
