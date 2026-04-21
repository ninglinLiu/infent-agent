// Mock conversation + strategy library for the Infent Agent demo.
// Each quick-question maps to a scripted multi-part assistant response and
// one or more executable strategy cards.

export type StrategyAction =
  | { kind: "buy" | "sell"; symbol: string; name: string; qtyPct: number /* of portfolio */ }
  | { kind: "hold"; symbol: string; name: string; note?: string }
  | { kind: "alloc"; symbol: string; name: string; target: number /* 0..1 weight */ }

export type Strategy = {
  id: string
  name: string
  nameEn: string
  thesis: string          // one-line reasoning shown in chat card
  thesisEn: string
  horizon: string         // e.g. "3–6 个月"
  horizonEn: string
  expectedReturn: number  // annualised, e.g. 0.12 -> +12%
  risk: 1 | 2 | 3 | 4 | 5 // star rating
  sharpe: number          // expected Sharpe lift after execution
  winRate: number         // backtest win rate 0..1
  drawdown: number        // estimated max DD, negative
  actions: StrategyAction[]
  tags: string[]
  tagsEn: string[]
  sectorImpact: Record<string, number> // sector name -> delta %
  narrative: string[]     // step-by-step rationale (shown expanded)
  narrativeEn: string[]
}

export type QuickQuestion = {
  id: string
  label: string           // short button label
  labelEn: string
  prompt: string          // full question Agent receives
  promptEn: string
  /** Pre-scripted assistant reply paragraphs (each shown with a typing delay) */
  reply: string[]
  replyEn: string[]
  strategyIds: string[]   // strategies offered at the end of reply
}

export const STRATEGIES: Record<string, Strategy> = {
  "stead-grow": {
    id: "stead-grow",
    name: "稳健成长组合 · Balanced Alpha",
    nameEn: "Balanced Alpha · Growth",
    thesis: "降息预期 + AI 产业链盈利上修，超配科技龙头 + 黄金对冲，控回撤。",
    thesisEn: "Rate-cut expectations + AI earnings revision: overweight tech leaders + gold hedge, control drawdown.",
    horizon: "6–12 个月",
    horizonEn: "6–12 months",
    expectedReturn: 0.142,
    risk: 2,
    sharpe: 0.38,
    winRate: 0.64,
    drawdown: -0.082,
    actions: [
      { kind: "alloc", symbol: "QQQ", name: "QQQ ETF", target: 0.28 },
      { kind: "buy",   symbol: "NVDA", name: "NVIDIA",  qtyPct: 0.05 },
      { kind: "alloc", symbol: "GLD", name: "黄金 ETF", target: 0.10 },
      { kind: "sell",  symbol: "TSLA", name: "Tesla",   qtyPct: 0.03 },
    ],
    tags: ["降息受益", "AI 产业链", "低回撤"],
    tagsEn: ["Rate-cut", "AI chain", "Low DD"],
    sectorImpact: { "AI 基础设施": +1.8, "科技": +1.1, "黄金": +0.6, "新能源": -0.4 },
    narrative: [
      "降息周期早期：成长股估值弹性最大，优先加仓 AI 基础设施 + 云软件。",
      "黄金 10% 作为对冲腿，若通胀超预期 / 地缘冲击可抵消 30%+ 波动。",
      "新能源短期被补贴退坡压制，减仓 Tesla 3% 转投 QQQ。",
    ],
    narrativeEn: [
      "Early rate-cut cycle: growth has max valuation beta; add AI infra + cloud software first.",
      "10% gold as a hedge leg; inflation/geopolitical shocks can offset 30%+ of equity vol.",
      "New energy pressured by subsidy roll-off; trim TSLA 3% into QQQ.",
    ],
  },
  "salary-5k": {
    id: "salary-5k",
    name: "月薪 5000 起步组合 · Starter Ladder",
    nameEn: "Starter Ladder · DCA",
    thesis: "每月定投：宽基 ETF + 货币基金，先保底再谈 Alpha。",
    thesisEn: "Monthly DCA: broad ETFs + money-market; safety first, then alpha.",
    horizon: "长期（3 年+）",
    horizonEn: "Long-term (3+ years)",
    expectedReturn: 0.082,
    risk: 1,
    sharpe: 0.25,
    winRate: 0.71,
    drawdown: -0.055,
    actions: [
      { kind: "alloc", symbol: "SPY", name: "SPY ETF",   target: 0.50 },
      { kind: "alloc", symbol: "CASH", name: "货币基金",  target: 0.30 },
      { kind: "alloc", symbol: "GLD", name: "黄金 ETF",  target: 0.10 },
      { kind: "alloc", symbol: "QQQ", name: "QQQ ETF",   target: 0.10 },
    ],
    tags: ["定投", "新手友好", "保底"],
    tagsEn: ["DCA", "Beginner", "Floor"],
    sectorImpact: { "科技": +0.5, "黄金": +0.3 },
    narrative: [
      "每月固定 1500 元定投 SPY（50%）+ 500 元 QQQ，不看盘，波动平滑。",
      "1500 元留现金/货基作为 3–6 个月应急，另 500 元黄金 ETF 对冲。",
      "坚持 3 年，年化 ≈ 8%，远跑赢 1.8% 银行理财。",
    ],
    narrativeEn: [
      "~$210/mo into SPY (50%) + ~$70/mo QQQ; ignore noise, smooth vol.",
      "Keep cash/MM for 3–6 mo emergency; ~$70/mo gold ETF as hedge.",
      "Over 3 years, ~8% CAGR vs ~1.8% bank deposits.",
    ],
  },
  "inflation-hedge": {
    id: "inflation-hedge",
    name: "抗通胀组合 · Real-Yield Shield",
    nameEn: "Real-Yield Shield",
    thesis: "通胀粘性 + 降息预期：现金贬值，加码黄金 / 优质资产 / TIPS。",
    thesisEn: "Sticky inflation + easing: cash loses real value; add gold, quality equities, TIPS.",
    horizon: "12 个月+",
    horizonEn: "12+ months",
    expectedReturn: 0.096,
    risk: 2,
    sharpe: 0.31,
    winRate: 0.68,
    drawdown: -0.07,
    actions: [
      { kind: "alloc", symbol: "GLD", name: "黄金 ETF", target: 0.20 },
      { kind: "alloc", symbol: "SPY", name: "SPY ETF",  target: 0.35 },
      { kind: "alloc", symbol: "QQQ", name: "QQQ ETF",  target: 0.20 },
      { kind: "alloc", symbol: "CASH", name: "货币/TIPS", target: 0.15 },
      { kind: "buy",   symbol: "AAPL", name: "Apple",   qtyPct: 0.02 },
    ],
    tags: ["抗通胀", "黄金", "防御"],
    tagsEn: ["Inflation", "Gold", "Defensive"],
    sectorImpact: { "黄金": +1.2, "科技": +0.6, "消费": +0.2 },
    narrative: [
      "真实利率见顶回落，黄金 ETF 提到 20%（历史回测此情形 +14%/年）。",
      "核心仓 SPY+QQQ 55%：盈利增速跑赢通胀的唯一资产类别。",
      "现金替换为短债/TIPS，既保流动性又拿到通胀补偿。",
    ],
    narrativeEn: [
      "Real rates peak then fall: GLD to 20% (historically ~+14%/yr in this regime).",
      "Core SPY+QQQ 55%: earnings growth is the main inflation-beating sleeve.",
      "Swap idle cash for bills/TIPS for liquidity + inflation linkage.",
    ],
  },
  "100k-1y": {
    id: "100k-1y",
    name: "10 万闲钱 · 1 年跑赢理财",
    nameEn: "$100K · Beat savings (1Y)",
    thesis: "目标 8%+ 年化，60/30/10 股债金：低波动 + 少择时。",
    thesisEn: "Target 8%+ annualised; 60/30/10 equity/bond/gold, low vol, minimal timing.",
    horizon: "1 年",
    horizonEn: "1 year",
    expectedReturn: 0.094,
    risk: 2,
    sharpe: 0.34,
    winRate: 0.66,
    drawdown: -0.062,
    actions: [
      { kind: "alloc", symbol: "SPY", name: "SPY ETF",  target: 0.45 },
      { kind: "alloc", symbol: "QQQ", name: "QQQ ETF",  target: 0.15 },
      { kind: "alloc", symbol: "CASH", name: "短债/货基", target: 0.30 },
      { kind: "alloc", symbol: "GLD", name: "黄金 ETF", target: 0.10 },
    ],
    tags: ["短周期", "低择时", "目标导向"],
    tagsEn: ["Short", "Low timing", "Goal"],
    sectorImpact: { "科技": +0.7, "黄金": +0.3 },
    narrative: [
      "60% 股票 ETF 提供主要 Alpha，30% 短债提供确定票息 ≈ 3.8%。",
      "10% 黄金对冲黑天鹅，蒙特卡洛 1000 次模拟：89% 概率跑赢银行理财。",
      "季度再平衡一次即可，不做日内择时。",
    ],
    narrativeEn: [
      "60% equity ETFs for alpha; 30% short-duration bonds ~3.8% carry.",
      "10% gold for tails; Monte Carlo: 89% chance to beat bank savings.",
      "Rebalance quarterly; no day-trading.",
    ],
  },
  "tencent-position": {
    id: "tencent-position",
    name: "腾讯持仓 · 分批加仓 + 备兑",
    nameEn: "Tencent · Scale-in + covered call",
    thesis: "南向资金连续流入 + 游戏版号放开，加仓 20% 同时卖出 2 周虚值 Call 收权利金。",
    thesisEn: "Southbound inflows + game licence tailwind: add in tranches + 2w OTM calls for premium.",
    horizon: "3 个月",
    horizonEn: "3 months",
    expectedReturn: 0.118,
    risk: 3,
    sharpe: 0.29,
    winRate: 0.61,
    drawdown: -0.11,
    actions: [
      { kind: "buy",  symbol: "0700", name: "腾讯控股", qtyPct: 0.04 },
      { kind: "hold", symbol: "0700", name: "腾讯控股", note: "备兑 Call 收权利金" },
    ],
    tags: ["港股", "备兑策略", "加仓"],
    tagsEn: ["HK", "Covered call", "Add"],
    sectorImpact: { "科技": +0.8, "消费": +0.3 },
    narrative: [
      "380 元下方分 3 批加仓，每批间隔 3–5 个交易日。",
      "卖出 2 周到期、行权价 410 的虚值 Call，年化权利金 +6.2%。",
      "若触发行权相当于 410 减持 20%，仍然浮盈；否则权利金白赚。",
    ],
    narrativeEn: [
      "Below ~380 HKD, add in 3 clips 3–5 sessions apart.",
      "Sell 2w OTM calls ~410 strike; ~+6.2% annualised premium.",
      "If assigned, trim ~20% at a profit; else keep premium.",
    ],
  },
  "new-energy": {
    id: "new-energy",
    name: "新能源反弹 · 战术仓",
    nameEn: "New energy · Tactical bounce",
    thesis: "板块情绪指数 0.22 极度悲观，历史上此水平 6 个月内均值回归 +12%。",
    thesisEn: "Sector sentiment 0.22 (extreme fear); historically +12% mean reversion within 6 months.",
    horizon: "3–6 个月",
    horizonEn: "3–6 months",
    expectedReturn: 0.162,
    risk: 4,
    sharpe: 0.22,
    winRate: 0.54,
    drawdown: -0.18,
    actions: [
      { kind: "buy",  symbol: "TSLA", name: "Tesla",     qtyPct: 0.02 },
      { kind: "alloc", symbol: "QQQ", name: "QQQ ETF",   target: 0.18 },
      { kind: "sell", symbol: "GLD",  name: "黄金 ETF",  qtyPct: 0.02 },
    ],
    tags: ["战术", "反弹", "情绪反转"],
    tagsEn: ["Tactical", "Bounce", "Sentiment"],
    sectorImpact: { "新能源": +2.1, "黄金": -0.4 },
    narrative: [
      "板块过度悲观：DCF 模型显示隐含 2030 年销量 < 2025 共识，错杀。",
      "小仓位（组合 6%）战术介入，严格止损 -8%。",
      "若技术面跌破前低则立即止损，不恋战。",
    ],
    narrativeEn: [
      "DCF implies 2030 volume below 2025 consensus — possible washout.",
      "Small sleeve (~6% book), hard stop -8%.",
      "Exit if price breaks prior low — no hero trades.",
    ],
  },
}

export const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: "q-salary",
    label: "我月薪 5000，怎么开始投资？",
    labelEn: "I earn $700/mo — how do I start?",
    prompt: "我月薪 5000，想开始投资，但完全没经验，怕亏。有什么稳健的起步方案？",
    promptEn: "I earn about $700/month and want to invest with zero experience and low risk. What's a conservative starter plan?",
    reply: [
      "先给你把底层逻辑讲清楚：月薪 5000 这个阶段，**第一目标不是赚多少，而是把「储蓄 → 投资」这条路径跑通**。",
      "按你的情况，我建议 4 步走：① 留 3–6 个月生活费（≈ 2 万）放货币基金；② 每月固定 2000 元定投宽基 ETF；③ 跟单我给你的组合，季度再平衡一次；④ 收入涨了再加配黄金/港股。",
      "别碰个股 / 杠杆 / 加密货币，先跑通 **3 年定投**。我已经给你生成了一个『月薪 5000 起步组合』，点下面卡片一键执行看看回测效果。",
    ],
    replyEn: [
      "First principle: at this income level, **the goal isn't max return — it's wiring savings → investing**.",
      "Four steps: ① 3–6 months expenses in MMF; ② monthly DCA into broad ETFs; ③ follow the portfolio below, rebalance quarterly; ④ add gold/HK when income grows.",
      "Avoid single stocks / leverage / crypto until **3-year DCA** is habit. Tap the Starter Ladder card to see backtest.",
    ],
    strategyIds: ["salary-5k"],
  },
  {
    id: "q-inflation",
    label: "通胀这么高，存款怎么办？",
    labelEn: "Inflation is high — what about cash?",
    prompt: "现在通胀还挺高，我几万块存款放银行感觉越来越不值钱，有什么办法能跑赢通胀又不要太激进？",
    promptEn: "Inflation is still elevated and my bank savings feel worthless. How can I beat inflation without going too aggressive?",
    reply: [
      "你的感受是对的：CPI 3.2% vs 大额存单 1.95%，**每存 1 年真实购买力 -1.25%**。放银行是慢性亏钱。",
      "抗通胀的资产有三类：① 黄金（过去 20 年年化 +7.8%）② 优质股票（盈利增长跑赢 CPI）③ TIPS / 短债（带通胀补偿）。",
      "我给你一个『Real-Yield Shield』组合，20% 黄金 + 55% 股票 + 15% 短债 + 10% 现金，回测 2008–2024 年化 9.6%，最大回撤 -7%。",
    ],
    replyEn: [
      "You're right: CPI 3.2% vs 1.95% CDs means **real purchasing power -1.25%/yr** — cash bleeds slowly.",
      "Three inflation hedges: ① gold (~+7.8%/yr over 20y) ② quality equities (earnings > CPI) ③ TIPS / short bonds.",
      "Here's **Real-Yield Shield**: 20% gold + 55% equities + 15% bills + 10% cash; 2008–2024 ~9.6% CAGR, max DD -7%.",
    ],
    strategyIds: ["inflation-hedge", "stead-grow"],
  },
  {
    id: "q-100k",
    label: "10 万闲钱，1 年目标跑赢理财",
    labelEn: "$100K spare — beat savings in 1Y",
    prompt: "我有 10 万闲钱，希望 1 年内跑赢银行理财（~2%），又不想承受太大波动，该怎么配？",
    promptEn: "I have ~$100K spare and want to beat ~2% bank savings in one year without huge volatility. How should I allocate?",
    reply: [
      "目标拆解：10 万 × 8% = 8000 元年收益，这是**高概率可达标**的目标（银行理财的 4 倍）。",
      "关键是**低择时**：不要 all in 某个热点。用 60/30/10 股债金结构，季度再平衡。",
      "我跑了 1000 次蒙特卡洛模拟：**89% 概率 1 年收益 ≥ 3%，67% 概率 ≥ 8%**，最差情况 -6%。已生成策略卡，点执行看具体仓位。",
    ],
    replyEn: [
      "Math: $100K × 8% = $8K — **achievable** vs 4× bank savings yield.",
      "**Low timing risk**: no single-theme all-in. Use 60/30/10 equity/bond/gold, rebalance quarterly.",
      "Monte Carlo (1000 paths): **89% prob ≥3% return, 67% ≥8%**, worst case ~-6%. Cards below — hit Execute for weights.",
    ],
    strategyIds: ["100k-1y", "stead-grow"],
  },
  {
    id: "q-tencent",
    label: "我持有腾讯 200 股，加仓还是减仓？",
    labelEn: "I hold 200 Tencent — add or trim?",
    prompt: "我持有 200 股腾讯，成本 342，现在 378，浮盈 10%。最近港股回暖，还能加仓吗？",
    promptEn: "I hold 200 Tencent — cost 342, now 378, +10% unrealised. HK market is warming — should I add?",
    reply: [
      "先看你的持仓：**浮盈 10.6%，组合权重 16%**，已经不算低了。继续加仓前要问自己两件事：是不是 all in 一个票？短期催化是否确定？",
      "基本面：① 南向资金连续 9 天净流入 ② 游戏版号审批放开 ③ 微信电商 GMV 超预期。**催化足够支持再加 4%**，但不建议超过 20% 权重。",
      "进阶做法：加仓同时卖出 2 周虚值 Call（备兑策略），**年化多拿 6.2% 权利金**，涨多了被行权也是高位减仓。我给你列了两个选项。",
    ],
    replyEn: [
      "Position check: **+10.6% unrealised, ~16% book weight** — already meaningful. Before adding: is this single-name risk OK? Are catalysts clear?",
      "Fundamentals: southbound inflows, game licence tailwind, WeChat commerce beat — **enough to add ~4%**, but cap single-name <20%.",
      "Advanced: add while selling 2w OTM calls (covered) for **~+6.2% extra premium/yr**; assignment = trim at highs. Two cards below.",
    ],
    strategyIds: ["tencent-position", "stead-grow"],
  },
  {
    id: "q-newenergy",
    label: "新能源板块还能追高吗？",
    labelEn: "Chase new energy here?",
    prompt: "新能源板块最近跌了不少，现在能抄底吗？还是说趋势已经变了？",
    promptEn: "New energy sold off hard — is it a dip or is the trend broken?",
    reply: [
      "坦诚地说：新能源**趋势未反转，但情绪极度悲观**。板块情绪指数 0.22（历史 5% 分位），此水平 6 个月内均值回归概率 68%。",
      "不建议重仓，但可以**战术性小仓位（组合 6% 以内）博反弹**，目标收益 12–16%，严格 -8% 止损。",
      "更稳妥的玩法是等技术面确认：站稳 60 日均线 + 成交量放大，再重仓。现在先观察。",
    ],
    replyEn: [
      "Honest take: **trend not confirmed, but sentiment is extreme**. Sector mood 0.22 (~5th percentile) — 68% mean-reversion odds within 6 months historically.",
      "Don't size up; **tactical sleeve ≤6% book**, target +12–16%, hard stop -8%.",
      "Safer: wait for price > 60d MA + volume — then size. Watch for now.",
    ],
    strategyIds: ["new-energy", "stead-grow"],
  },
  {
    id: "q-rate-cut",
    label: "美联储降息，我的科技股要调整吗？",
    labelEn: "Fed cuts — rotate my tech?",
    prompt: "听说美联储要降息了，我手里主要是美股科技股，要不要换仓？",
    promptEn: "I hear the Fed may cut rates. I hold mostly US tech — should I rotate?",
    reply: [
      "**降息 + 科技股 = 天作之合**，不用恐慌。过去 4 轮降息周期，降息首月 QQQ 平均 +6.3%，半年 +18.1%。",
      "但有两个细节：① 前期已经 price in 了一部分，**避免追高**，等回调再加。② **半导体 > 软件 > 硬件**，优先 NVDA / AI 基础设施。",
      "我给你一个降息受益组合：加仓 AI 基础设施、小幅减 Tesla、加 10% 黄金对冲美元走弱。",
    ],
    replyEn: [
      "**Cuts + tech = usually friends** — don't panic. Past 4 cycles: QQQ +6.3% first month on average, +18.1% half-year.",
      "Caveats: ① some cuts are priced — **avoid chasing** dips; ② **semis > software > hardware** — NVDA / AI infra first.",
      "Beneficiary sleeve: add AI infra, trim Tesla slightly, +10% gold vs USD weakness.",
    ],
    strategyIds: ["stead-grow", "inflation-hedge"],
  },
]

// Generic fallback responses for free-form typing
export function genericReply(text: string): {
  replyZh: string[]
  replyEn: string[]
  strategyIds: string[]
} {
  const t = text.toLowerCase()
  if (t.includes("nvda") || t.includes("nvidia") || t.includes("英伟达")) {
    return {
      replyZh: [
        "NVIDIA 当前估值 **Forward P/E 32x**，低于过去 5 年中位数 38x；数据中心 Q2 指引 +142% YoY。",
        "AI 算力需求仍有 2–3 年强劲增长窗口，但要注意**仓位单票 < 12%**。推荐跟单稳健成长组合，内含 NVDA 5%。",
      ],
      replyEn: [
        "NVDA trades **~32x forward P/E**, below the 5y median ~38x; datacenter guide +142% YoY.",
        "AI demand has 2–3y runway; **keep any single name <12%** of book. Balanced Alpha includes ~5% NVDA.",
      ],
      strategyIds: ["stead-grow"],
    }
  }
  if (t.includes("btc") || t.includes("bitcoin") || t.includes("比特币")) {
    return {
      replyZh: [
        "加密货币不在我的主推列表，但如果你非要配置，**建议不超过总资产的 5%**，用美股 IBIT / BTC ETF 而非中心化交易所，降低合规风险。",
        "现阶段相关性 > 黄金，对冲价值有限。我更推荐经典 60/30/10 结构。",
      ],
      replyEn: [
        "Crypto isn't core, but if you must: **≤5% of net worth**, use IBIT / BTC ETFs in a brokerage account—not unregulated venues.",
        "Correlation vs gold is loose; hedge value is limited. Prefer classic 60/30/10.",
      ],
      strategyIds: ["100k-1y"],
    }
  }
  return {
    replyZh: [
      "我理解你在问：「" + text + "」。我帮你拆一下思路 —",
      "关键信号：① 宏观利率进入下行通道 ② AI 产业链盈利持续上修 ③ 港股南向资金连续流入。综合来看建议**偏股 + 少量黄金对冲**。",
      "给你两张策略卡，对应不同风险偏好，选一个点执行看全盘联动效果。",
    ],
    replyEn: [
      "You asked: \" " + text + " \" — here's how I'd frame it.",
      "Signals: ① rates easing ② AI earnings revision ③ HK southbound flows. Net: **tilt equities + small gold hedge**.",
      "Two strategy cards below — pick one and hit Execute to animate the console.",
    ],
    strategyIds: ["stead-grow", "100k-1y"],
  }
}
