"use client"

import { useLang, type Lang } from "@/lib/i18n"

export type ShowcaseCopy = {
  hero: {
    eyebrow: string
    live: string
    title1: string
    title2: string
    title3: string
    leadBefore: string
    leadHighlights: [string, string, string, string]
    leadAfter: string
    cta: string
    explore: string
    stats: { k: string; v: string }[]
  }
  problem: {
    kicker: string
    titleBefore: string
    titleHighlight: string
    titleAfter: string
    lead: string
    painLabel: string
    cards: { tag: string; title: string; body: string }[]
  }
  solution: {
    kicker: string
    titleBefore: string
    titlePain: string
    titleMid: string
    titleClick: string
    painLabel: string
    solutionLabel: string
    pairs: { pain: string; solution: string }[]
    functionsKicker: string
    functionsTitle: string
    tryConsole: string
    functionLabel: string
    more: string
    functions: { title: string; body: string }[]
  }
  landscape: {
    kicker: string
    titleBefore: string
    titlePolar: string
    titleMid: string
    titleMiddle: string
    target: string
    drawbacks: string
    deliver: string
    core: string
    coreBefore: string
    coreAfter: string
    proPill: string
    usPill: string
    consumerPill: string
    pro: { name: string; example: string; target: string; items: string[] }
    us: { name: string; example: string; target: string; items: string[] }
    mass: { name: string; example: string; target: string; items: string[] }
  }
  value: {
    kicker: string
    titleBefore: string
    titleHighlight: string
    lead: string
    audienceTitle: string
    painTitle: string
    uniqueTitle: string
    diffKicker: string
    diffBefore: string
    diffPro: string
    diffMid: string
    diffFriendly: string
    diffAfter: string
    diffLead: string
    audience: string[]
    pains: string[]
    unique: string[]
  }
  brand: {
    kicker: string
    titleBefore: string
    titleTrust: string
    titleMid: string
    titleSpeed: string
    sculptureTitle: string
    xpLabel: string
    loopTitle: string
    loopSub: string
    sculpture: { label: string; text: string }[]
    xp: string[]
    loyalty: { k: string; v: string }[]
  }
  team: {
    kicker: string
    titleBefore: string
    titleHighlight: string
    titleAfter: string
    lead: string
    members: { role: string; skills: string }[]
  }
  cta: {
    kicker: string
    titleLaunch: string
    titleRest: string
    lead: string
    open: string
    source: string
    report: string
  }
  footer: {
    console: string
  }
  common: {
    team: string
  }
}

const ZH: ShowcaseCopy = {
  hero: {
    eyebrow: "v2025.11 · 面向普通投资者的 AI",
    live: "实时 Demo 运行中",
    title1: "全智能",
    title2: "投资顾问",
    title3: "与风险管理 AI。",
    leadBefore: "专业级金融分析，小白也能看懂。端到端 AI 投顾流程，把",
    leadHighlights: ["用户画像", "策略生成", "实时风控", "一键组合执行"],
    leadAfter: "串在一起——专为万得与彭博遗忘的 9 亿普通投资者设计。",
    cta: "打开控制台",
    explore: "了解它如何工作",
    stats: [
      { k: "9亿+", v: "被专业工具忽视的普通投资者" },
      { k: "< 30秒", v: "从自然语言提问到可执行策略" },
      { k: "3", v: "我们独家覆盖的市场缺口" },
      { k: "100%", v: "结论翻译成白话" },
    ],
  },
  problem: {
    kicker: "机会与问题识别",
    titleBefore: "网络金融里的",
    titleHighlight: "三个缺口",
    titleAfter: "。",
    lead: "当我们梳理 AI 在金融市场的真实落地，发现三个结构性缺口——也是普通投资者第一天就会撞上的墙。",
    painLabel: "痛点",
    cards: [
      {
        tag: "群体痛点",
        title: "知识鸿沟",
        body: "大多数非金融从业者想买股票、基金，却缺少系统金融知识——读不懂报表，听不懂术语，也辩不清逻辑。",
      },
      {
        tag: "决策困境",
        title: "凭感觉交易",
        body: "没有实战经验，普通投资者只能靠直觉，频繁踩坑、暴露在市场风险里——追涨杀跌，循环往复。",
      },
      {
        tag: "供给缺口",
        title: "工具只服务专业人士",
        body: "现有产品面向机构（万得、彭博）——术语密、要付费、学习曲线陡。大众 App 又太浅。中间是空白。",
      },
    ],
  },
  solution: {
    kicker: "创新方案",
    titleBefore: "从",
    titlePain: "痛点",
    titleMid: "到",
    titleClick: "一键策略。",
    painLabel: "痛点",
    solutionLabel: "方案",
    pairs: [
      {
        pain: "非金融从业者缺少系统金融知识。",
        solution: "把金融推理嵌进每一次 AI 输出——脚注、一句话理由、入门术语表。",
      },
      {
        pain: "普通投资者靠直觉，容易犯错。",
        solution: "AI 客观分析宏观、板块轮动与情绪——执行前先做压力测试。",
      },
      {
        pain: "没有万得 / 彭博的亲民替代品。",
        solution: "轻量对话控制台——用自然语言提问，拿到可执行策略卡，一键落地。",
      },
    ],
    functionsKicker: "产品功能",
    functionsTitle: "三根支柱，今天就能用。",
    tryConsole: "试用实时控制台",
    functionLabel: "功能",
    more: "更多功能，敬请期待。——第三组",
    functions: [
      {
        title: "端到端投顾流程",
        body: "用户画像 → 策略生成 → 风险监控 → 组合优化，一条链路走完。",
      },
      {
        title: "对话式界面",
        body: "用白话中文或英文提问。Agent 返回带推理的排序策略卡。",
      },
      {
        title: "实时组合风控",
        body: "夏普、回撤、VaR、板块暴露与情绪指标——一眼看清。",
      },
    ],
  },
  landscape: {
    kicker: "竞争格局",
    titleBefore: "市场已经",
    titlePolar: "两极分化。",
    titleMid: "我们填上",
    titleMiddle: "中间地带。",
    target: "客群",
    drawbacks: "短板",
    deliver: "我们交付什么",
    core: "核心优势",
    coreBefore: "专业级分析",
    coreAfter: "小白也能看懂。",
    proPill: "专业",
    usPill: "★ 我们的差异化",
    consumerPill: "消费级",
    pro: {
      name: "专业工具",
      example: "万得 · 彭博终端 · Refinitiv",
      target: "机构与资深从业者",
      items: ["功能复杂、术语密集", "学习曲线陡", "付费订阅（$24K+/年）", "普通投资者用不上"],
    },
    us: {
      name: "全智能 AI",
      example: "我们的方案",
      target: "被忽视的 9 亿普通投资者",
      items: [
        "AI + 金融知识图谱",
        "多维数据融合",
        "术语自动翻译成白话",
        "专业级分析，入门级体验",
        "对话式、一键可执行策略",
      ],
    },
    mass: {
      name: "大众工具",
      example: "理财 App · 智能投顾",
      target: "普通用户",
      items: ["分析维度单一", "结论流于表面", "只靠基础数据", "缺少专业推理逻辑"],
    },
  },
  value: {
    kicker: "价值主张画布",
    titleBefore: "为特定的人而做。",
    titleHighlight: "不是所有人。",
    lead: "我们倒着画这张画布——先想象用户（28 岁上班族，存款 10 万，零经验），再倒推功能。",
    audienceTitle: "目标用户",
    painTitle: "要解决的痛点",
    uniqueTitle: "独特价值",
    diffKicker: "关键差异化",
    diffBefore: "同时拿住",
    diffPro: "专业分析",
    diffMid: "和",
    diffFriendly: "好用",
    diffAfter: "——既不像专业终端那样复杂，也不像消费 App 那样浅。",
    diffLead: "我们填上每年 2.4 万美元终端和一键智能投顾之间的空白。是同伴，不是仪表盘。",
    audience: ["非专业人士与普通投资者", "想投资但缺少金融知识", "需要一条进场的平缓坡道"],
    pains: ["缺少专业金融知识", "凭直觉，容易犯错", "没有兼顾专业与体验的工具"],
    unique: ["把术语和复杂输出说成人话", "AI 驱动的客观分析", "轻量设计，降低门槛"],
  },
  brand: {
    kicker: "品牌与客户体验",
    titleBefore: "品牌为",
    titleTrust: "信任",
    titleMid: "体验为",
    titleSpeed: "速度调校。",
    sculptureTitle: "品牌雕塑",
    xpLabel: "客户体验",
    loopTitle: "客户忠诚闭环",
    loopSub: "三根留存支柱",
    sculpture: [
      { label: "定位", text: "面向普通投资者的轻量金融助手" },
      { label: "形象", text: "可靠、好用、亲近的专业伙伴" },
      { label: "差异化", text: "陪伴式 · 心理门槛低" },
    ],
    xp: ["零门槛上手", "清晰、无术语的分析输出", "一键操作 + 智能问答", "适配手机，碎片时间也能用"],
    loyalty: [
      { k: "价值留存", v: "AI 迭代 + 投资洞察" },
      { k: "情感连接", v: "反馈响应 + 专属权益" },
      { k: "信任建设", v: "逻辑透明 + 真实案例" },
    ],
  },
  team: {
    kicker: "团队 · 角色与技能",
    titleBefore: "一本去中心化的",
    titleHighlight: "认知、责任",
    titleAfter: "与创造力账本。",
    lead: "第三组 · 中信证券 2025 创新课题。覆盖产品、工程与研究的全栈团队——每个里程碑都记在学期日志上。",
    members: [
      { role: "项目负责人", skills: "把握项目方向，协调任务，确保跨组交付顺畅。" },
      { role: "技术负责人", skills: "设计系统架构，搭建 AI/ML 组件，打通平台 API。" },
      { role: "研究分析", skills: "开展定性与定量研究，从数据中提炼关键发现与趋势。" },
      { role: "研究分析", skills: "原型功能设计" },
    ],
  },
  cta: {
    kicker: "产品演示 · 06",
    titleLaunch: "打开",
    titleRest: "控制台。",
    lead: "产品已经上线，可以完整交互。用白话提问，拿到排序策略卡，点执行，看风险 / 盈亏 / 暴露实时更新。",
    open: "打开实时控制台",
    source: "查看源码",
    report: "报告日期 2025/11/25",
  },
  footer: {
    console: "控制台",
  },
  common: {
    team: "第三组 · 中信证券课题",
  },
}

const EN: ShowcaseCopy = {
  hero: {
    eyebrow: "v2025.11 · AI for ordinary investors",
    live: "Live demo running",
    title1: "Omni-Intelligent",
    title2: "Investment Advisor",
    title3: "& Risk Management AI.",
    leadBefore: "Professional-grade financial analysis, beginner-friendly understanding. An end-to-end AI advisory workflow combining",
    leadHighlights: ["user profiling", "strategy generation", "live risk monitoring", "one-click portfolio execution"],
    leadAfter: "— designed for the 900M ordinary investors that Wind & Bloomberg forgot.",
    cta: "Launch Console",
    explore: "Explore how it works",
    stats: [
      { k: "900M+", v: "Ordinary investors underserved by pro tools" },
      { k: "< 30s", v: "From natural-language question to executable strategy" },
      { k: "3", v: "Market gaps uniquely addressed by our system" },
      { k: "100%", v: "Conclusions translated into plain language" },
    ],
  },
  problem: {
    kicker: "Opportunity & Problem Identification",
    titleBefore: "Three gaps in the",
    titleHighlight: "cyber-finance",
    titleAfter: "market.",
    lead: "When we mapped how AI is actually deployed in financial markets today, we found three structural gaps — the same gaps every ordinary investor runs into on day one.",
    painLabel: "Pain point",
    cards: [
      {
        tag: "Group Pain Point",
        title: "Knowledge gap",
        body: "Most non-financial professionals want to invest in stocks/funds but lack systematic financial knowledge — they can't read a balance sheet, can't parse jargon, and can't debate a thesis.",
      },
      {
        tag: "Decision Dilemma",
        title: "Intuition-driven",
        body: "Without practical experience, ordinary investors rely on gut feeling, facing frequent mistakes and market risks — buy high, sell low, and repeat.",
      },
      {
        tag: "Supply Gap",
        title: "Tools for pros only",
        body: "Existing products target institutions (Wind, Bloomberg) — dense jargon, paid subscriptions, steep learning curves. Mass-market apps are superficial. Nothing in between.",
      },
    ],
  },
  solution: {
    kicker: "Proposed Innovative Solution",
    titleBefore: "From",
    titlePain: "pain point",
    titleMid: "to",
    titleClick: "one-click strategy.",
    painLabel: "Pain",
    solutionLabel: "Solution",
    pairs: [
      {
        pain: "Non-financial professionals lack systematic financial knowledge.",
        solution: "Simplify and embed financial reasoning into every AI output — footnotes, one-line rationale, beginner glossary.",
      },
      {
        pain: "Ordinary investors rely on intuition, leading to mistakes.",
        solution: "AI-driven objective analysis of macro factors, sector rotation, and sentiment — stress-tested before execution.",
      },
      {
        pain: "No user-friendly alternative to Wind / Bloomberg.",
        solution: "A lightweight conversational console — ask in natural language, get executable strategy cards, one-click apply.",
      },
    ],
    functionsKicker: "Product functions",
    functionsTitle: "Three pillars, shipping today.",
    tryConsole: "Try live console",
    functionLabel: "Function",
    more: "Please look forward to more functions. — Group 3",
    functions: [
      {
        title: "End-to-end advisory workflow",
        body: "User profiling → strategy generation → risk monitoring → portfolio optimization, all in one flow.",
      },
      {
        title: "Conversational interface",
        body: "Ask any investment question in plain Mandarin or English. Agent returns ranked strategies with AI reasoning.",
      },
      {
        title: "Live portfolio risk",
        body: "Real-time sharpe, drawdown, VaR, sector exposure and sentiment indicators — all at a glance.",
      },
    ],
  },
  landscape: {
    kicker: "Competitive Landscape",
    titleBefore: "The market is",
    titlePolar: "polarised.",
    titleMid: "We fill the",
    titleMiddle: "middle.",
    target: "Target",
    drawbacks: "Drawbacks",
    deliver: "What we deliver",
    core: "Core advantage",
    coreBefore: "Professional-grade analysis",
    coreAfter: "beginner-friendly understanding.",
    proPill: "Pro",
    usPill: "★ Our differentiation",
    consumerPill: "Consumer",
    pro: {
      name: "Professional tools",
      example: "Wind · Bloomberg Terminal · Refinitiv",
      target: "Institutions & seasoned practitioners",
      items: [
        "Complex functions, dense jargon",
        "High learning curve",
        "Paid subscriptions ($24K+/yr)",
        "Not accessible to ordinary investors",
      ],
    },
    us: {
      name: "Omni-Intelligent AI",
      example: "Our solution",
      target: "The 900M underserved ordinary investors",
      items: [
        "AI-powered with financial knowledge graphs",
        "Multi-dimensional data fusion",
        "Jargon automatically translated to plain language",
        "Professional-grade analysis, beginner-friendly UX",
        "Conversational, one-click executable strategies",
      ],
    },
    mass: {
      name: "Mass-market tools",
      example: "Wealth management apps · Robo-advisors",
      target: "Ordinary users",
      items: [
        "Single-dimensional analysis",
        "Superficial conclusions",
        "Relies on basic data",
        "Lacks professional reasoning logic",
      ],
    },
  },
  value: {
    kicker: "Value Proposition Canvas",
    titleBefore: "Built for a specific person.",
    titleHighlight: "Not everyone.",
    lead: "We designed the canvas backwards — starting from an imagined user (a 28-year-old salaried professional with ¥100K savings and zero experience) — and working back to features.",
    audienceTitle: "Target audience",
    painTitle: "Pain points solved",
    uniqueTitle: "Unique value delivered",
    diffKicker: "Key differentiator",
    diffBefore: "Balance",
    diffPro: "professional analysis",
    diffMid: "and",
    diffFriendly: "user-friendliness",
    diffAfter: "— unlike complex pro tools or superficial consumer apps.",
    diffLead: "We fill the market gap between $24K/yr terminals and single-tap robo-advisors. A companion, not a dashboard.",
    audience: [
      "Non-professionals & ordinary investors",
      "Want to invest but lack financial knowledge",
      "Need an accessible on-ramp to the market",
    ],
    pains: [
      "Lack professional financial knowledge",
      "Rely on intuition, prone to mistakes",
      "No user-friendly tools balancing pro & UX",
    ],
    unique: [
      "Simplify financial jargon & complex outputs",
      "AI-driven objective analysis",
      "Lightweight design, lower barriers",
    ],
  },
  brand: {
    kicker: "Branding & Customer Experience",
    titleBefore: "Brand sculpted for",
    titleTrust: "trust.",
    titleMid: "Experience tuned for",
    titleSpeed: "speed.",
    sculptureTitle: "Brand sculpture",
    xpLabel: "Customer experience",
    loopTitle: "Customer loyalty loop",
    loopSub: "3 retention pillars",
    sculpture: [
      { label: "Positioning", text: "Lightweight financial assistant for ordinary investors" },
      { label: "Image", text: "Reliable, user-friendly, approachable professional" },
      { label: "Differentiation", text: "Companion-based · low psychological threshold" },
    ],
    xp: [
      "Zero-threshold onboarding",
      "Clear, jargon-free analysis output",
      "One-click operation + intelligent Q&A",
      "Mobile-compatible for fragmented use",
    ],
    loyalty: [
      { k: "Value retention", v: "AI iteration + investment insights" },
      { k: "Emotional connection", v: "Feedback response + exclusive benefits" },
      { k: "Trust building", v: "Transparent logic + real user cases" },
    ],
  },
  team: {
    kicker: "Team · Neon Roles & Byte Skills",
    titleBefore: "A decentralized ledger of",
    titleHighlight: "cognition, accountability",
    titleAfter: "& creative wattage.",
    lead: "Group 3 · CITIC Securities Innovation Project 2025. A full-stack team covering product, engineering, and research — each milestone time-stamped on our immutable semester log.",
    members: [
      { role: "Project Lead", skills: "Oversees project direction, coordinates tasks, and ensures smooth delivery across teams." },
      { role: "Technical Lead", skills: "Designs the system architecture, builds AI/ML components, integrates APIs across the platform." },
      { role: "Research Analyst", skills: "Conducts qualitative and quantitative research. Analyzes data to identify key findings and trends." },
      { role: "Research Analyst", skills: "Prototype feature design." },
    ],
  },
  cta: {
    kicker: "Product demonstration · 06",
    titleLaunch: "Launch",
    titleRest: "the console.",
    lead: "The product is live and fully interactive. Ask a question in plain language, receive a ranked strategy card, hit execute, and watch risk / PnL / exposure update in real time.",
    open: "Open live console",
    source: "View source",
    report: "Report Date 2025/11/25",
  },
  footer: {
    console: "Console",
  },
  common: {
    team: "Group 3 · CITIC Securities Project",
  },
}

const COPY: Record<Lang, ShowcaseCopy> = { zh: ZH, en: EN }

export function getShowcaseCopy(lang: Lang): ShowcaseCopy {
  return COPY[lang]
}

export function useShowcaseCopy(): ShowcaseCopy {
  const { lang } = useLang()
  return COPY[lang]
}
