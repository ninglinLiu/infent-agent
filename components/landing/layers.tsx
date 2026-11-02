'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { LiveState } from '@/lib/market/live'

type Lang = 'zh' | 'en'

function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export function useVisible<T extends Element>(ref: React.RefObject<T | null>) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return visible
}

/** VIX → 心率。市场越紧张，心跳越快；拿不到数据时按常见静息心率 72 */
export function heartRate(vix: number | undefined) {
  return vix ? Math.round(Math.min(120, Math.max(58, 55 + vix * 1.1))) : 72
}
export function calmness(vix: number | undefined) {
  return vix ? Math.min(99, Math.max(5, 100 - (vix - 10) * 3.3)) : null
}

/* ---------------- Layer 3: narrative noise ---------------- */

const CHATTER: Record<Lang, string[]> = {
  zh: ['这次不一样', '抄底！', '满仓了', '听说要降息', '已清仓', '大 V 说稳了', 'AI 泡沫？', '跑不跑？', '再等等', '山顶站岗', '割肉了', '要起飞', '别慌', '利好出尽', '庄家在洗盘', '涨停！', '我早说了', '加仓加仓', '睡不着', '跌麻了'],
  en: ['this time is different', 'buy the dip!', 'all in', 'rate cut soon?', 'I’m out', 'they say it’s safe', 'AI bubble?', 'sell now?', 'wait a bit', 'bagholding', 'cut my losses', 'to the moon', 'don’t panic', 'priced in', 'it’s a shakeout', 'limit up!', 'told you so', 'add more', 'can’t sleep', 'down bad'],
}

type Bubble = { id: number; text: string; x: number; y: number; flip: boolean }

export function NarrativeLayer({ lang, active }: { lang: Lang; active: boolean }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const counter = useRef(0)
  useEffect(() => {
    if (!active) return
    const r = rng(Date.now() % 100000)
    const spawn = () => setBubbles(list => {
      const used = new Set(list.map(b => `${Math.round(b.x / 16)}-${Math.round(b.y / 24)}`))
      let x = 0, y = 0
      for (let i = 0; i < 8; i++) { x = 2 + r() * 80; y = 4 + r() * 58; if (!used.has(`${Math.round(x / 16)}-${Math.round(y / 24)}`)) break }
      const pool = CHATTER[lang]
      const next = { id: ++counter.current, text: pool[Math.floor(r() * pool.length)], x, y, flip: r() < .5 }
      return [...list.slice(-15), next]
    })
    for (let i = 0; i < 9; i++) spawn()
    const id = setInterval(() => { spawn(); setBubbles(list => list.slice(-16)) }, 520)
    return () => clearInterval(id)
  }, [active, lang])
  const crowd = useMemo(() => {
    const r = rng(42)
    return Array.from({ length: 46 }, (_, i) => ({ x: 1 + i * 2.15 + r() * .8, h: 9 + r() * 6, w: 3 + r() * 1.4 }))
  }, [])
  return <div className="lp-narrative">
    {bubbles.map(b => <span key={b.id} className={`lp-bubble ${b.flip ? 'flip' : ''}`} style={{ left: `${b.x}%`, top: `${b.y}%` }}>{b.text}</span>)}
    <svg className="lp-crowd" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true">
      {crowd.map((p, i) => <g key={i} transform={`translate(${p.x} ${16 - p.h})`}><circle cx={p.w / 2} cy={1.6} r={1.25} /><rect x={.2} y={3} width={p.w - .4} height={p.h - 3} rx={.8} /></g>)}
    </svg>
  </div>
}

/* ---------------- Layer 2: market signal ---------------- */

function candlesFrom(values: number[], group = 3) {
  const out: Array<{ o: number; h: number; l: number; c: number }> = []
  for (let i = 0; i + group <= values.length; i += group) {
    const slice = values.slice(i, i + group)
    const o = i ? values[i - 1] : slice[0]
    out.push({ o, c: slice[slice.length - 1], h: Math.max(o, ...slice), l: Math.min(o, ...slice) })
  }
  return out
}

function CandlePanel({ symbol, values, label }: { symbol: string; values: number[]; label: string }) {
  const candles = candlesFrom(values)
  if (candles.length < 4) return <div className="lp-panel"><b>{symbol}</b><span className="lp-wait">{label}</span></div>
  const hi = Math.max(...candles.map(c => c.h)), lo = Math.min(...candles.map(c => c.l)), span = hi - lo || 1
  const W = 300, H = 120, step = W / candles.length
  const y = (v: number) => 6 + (1 - (v - lo) / span) * (H - 12)
  return <div className="lp-panel"><header><b>{symbol}</b><small>{label}</small></header>
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {[.25, .5, .75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="lp-grid" />)}
      {candles.map((c, i) => {
        const up = c.c >= c.o, x = i * step + step / 2
        return <g key={i} className={up ? 'up' : 'down'}><line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} /><rect x={x - step * .32} width={step * .64} y={Math.min(y(c.o), y(c.c))} height={Math.max(1, Math.abs(y(c.o) - y(c.c)))} /></g>
      })}
    </svg>
  </div>
}

function LinePanel({ symbol, values, label }: { symbol: string; values: number[]; label: string }) {
  if (values.length < 4) return <div className="lp-panel"><b>{symbol}</b><span className="lp-wait">{label}</span></div>
  const hi = Math.max(...values), lo = Math.min(...values), span = hi - lo || 1
  const W = 300, H = 120
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${6 + (1 - (v - lo) / span) * (H - 12)}`)
  return <div className="lp-panel"><header><b>{symbol}</b><small>{label}</small></header>
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {[.25, .5, .75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="lp-grid" />)}
      <polygon points={`0,${H} ${pts.join(' ')} ${W},${H}`} className="lp-area" />
      <polyline points={pts.join(' ')} className="lp-line" />
    </svg>
  </div>
}

export function MarketLayer({ live, lang }: { live: LiveState; lang: Lang }) {
  const q = live.quotes
  const rows = ['SPX', 'NDX', 'HSI', 'CSI300', 'N225', 'VIX']
  const wait = lang === 'en' ? 'waiting for feed…' : '等待行情…'
  return <div className="lp-market">
    <CandlePanel symbol="NDX" values={q.NDX?.spark ?? []} label={q.NDX ? (lang === 'en' ? 'intraday · 15m' : '日内 · 15 分钟') : wait} />
    <LinePanel symbol="SPX" values={q.SPX?.spark ?? []} label={q.SPX ? (lang === 'en' ? 'intraday · 5m' : '日内 · 5 分钟') : wait} />
    <div className="lp-panel lp-board">
      {rows.map(s => {
        const c = q[s]?.changePct
        return <div key={s}><b>{s}</b><span className={c === undefined || c === null ? '' : c >= 0 ? 'up' : 'down'}>{c === undefined || c === null ? '—' : `${c >= 0 ? '+' : ''}${c.toFixed(2)}%`}</span></div>
      })}
    </div>
  </div>
}

/* ---------------- Layer 1: protocol / oracle network ---------------- */

export function NetworkLayer({ live, active }: { live: LiveState; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const labels = useRef<Array<{ pair: string; price: number }>>([])
  labels.current = Object.values(live.oracle).slice(0, 6).map(r => ({ pair: r.pair, price: r.price }))
  useEffect(() => {
    const el = canvas.current
    if (!el || !active) return
    const ctx = el.getContext('2d')!
    const r = rng(9)
    let w = 0, h = 0, raf = 0
    type Node = { x: number; y: number; vx: number; vy: number; hub: number }
    let nodes: Node[] = [], edges: Array<[number, number]> = []
    const packets: Array<{ e: number; t: number; speed: number }> = []
    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      w = el.clientWidth; h = el.clientHeight
      el.width = w * dpr; el.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(70, Math.max(28, w * h / 5200)))
      nodes = Array.from({ length: count }, (_, i) => ({ x: r() * w, y: 8 + r() * (h - 16), vx: (r() - .5) * .12, vy: (r() - .5) * .08, hub: i < 6 ? i : -1 }))
      edges = []
      nodes.forEach((a, i) => {
        nodes.map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 })).filter(o => o.j !== i).sort((x, y) => x.d - y.d).slice(0, 3)
          .forEach(o => { if (!edges.some(([p, q]) => (p === o.j && q === i))) edges.push([i, o.j]) })
      })
    }
    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(el)
    let last = performance.now()
    const draw = (now: number) => {
      const dt = Math.min(50, now - last); last = now
      ctx.clearRect(0, 0, w, h)
      for (const n of nodes) {
        n.x += n.vx * dt * .06; n.y += n.vy * dt * .06
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 6 || n.y > h - 6) n.vy *= -1
      }
      ctx.lineWidth = .7
      for (const [a, b] of edges) {
        const p = nodes[a], q = nodes[b]
        ctx.strokeStyle = p.hub >= 0 || q.hub >= 0 ? 'rgba(150,190,255,.32)' : 'rgba(120,150,210,.16)'
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
      }
      if (packets.length < 26 && r() < .35) packets.push({ e: Math.floor(r() * edges.length), t: 0, speed: .0006 + r() * .0012 })
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i]; pk.t += pk.speed * dt
        if (pk.t >= 1) { packets.splice(i, 1); continue }
        const [a, b] = edges[pk.e] ?? [0, 0]; const p = nodes[a], q = nodes[b]
        const x = p.x + (q.x - p.x) * pk.t, y = p.y + (q.y - p.y) * pk.t
        const g = ctx.createRadialGradient(x, y, 0, x, y, 5)
        g.addColorStop(0, 'rgba(220,235,255,.95)'); g.addColorStop(1, 'rgba(120,170,255,0)')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill()
      }
      ctx.font = '10px ui-monospace, Consolas, monospace'
      for (const n of nodes) {
        const big = n.hub >= 0
        const rad = big ? 3.2 + Math.sin(now / 400 + n.hub) * .8 : 1.4
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rad * 4)
        g.addColorStop(0, big ? 'rgba(235,242,255,.95)' : 'rgba(190,210,255,.7)'); g.addColorStop(1, 'rgba(120,160,255,0)')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, rad * 4, 0, Math.PI * 2); ctx.fill()
        const label = big ? labels.current[n.hub] : undefined
        if (label) {
          const text = `${label.pair}  ${label.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
          const width = ctx.measureText(text).width
          ctx.fillStyle = 'rgba(205,220,255,.85)'
          // 靠右边的节点把标签画在左侧，避免被裁掉
          ctx.fillText(text, n.x + 7 + width > w - 4 ? n.x - 7 - width : n.x + 7, Math.max(10, n.y - 6))
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [active])
  return <canvas ref={canvas} className="lp-network" aria-hidden="true" />
}

/* ---------------- HUD pieces ---------------- */

export function NoiseBox({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el || !active) return
    const ctx = el.getContext('2d')!
    const w = el.width = 160, h = el.height = 56
    const image = ctx.createImageData(w, h)
    let raf = 0, frame = 0
    const draw = () => {
      if (frame++ % 3 === 0) {
        for (let i = 0; i < image.data.length; i += 4) {
          const row = Math.floor(i / 4 / w)
          const v = Math.random() * 200 * (row % 3 === 0 ? .6 : 1)
          image.data[i] = image.data[i + 1] = image.data[i + 2] = v; image.data[i + 3] = 255
        }
        ctx.putImageData(image, 0, 0)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [active])
  return <canvas ref={canvas} className="lp-noise" aria-hidden="true" />
}

export function SystemLog({ lines }: { lines: string[] }) {
  const [shown, setShown] = useState(0)
  const [chars, setChars] = useState(0)
  const key = lines.join('|')
  useEffect(() => { setShown(0); setChars(0) }, [key])
  useEffect(() => {
    if (shown >= lines.length) return
    const line = lines[shown]
    const id = setTimeout(() => {
      if (chars < line.length) setChars(c => c + 2)
      else { setShown(n => n + 1); setChars(0) }
    }, chars < line.length ? 22 : 260)
    return () => clearTimeout(id)
  }, [shown, chars, lines])
  return <div className="lp-log-lines">{lines.slice(0, shown).map((l, i) => <div key={i}>{l}</div>)}{shown < lines.length && <div>{lines[shown].slice(0, chars)}<span className="lp-caret" /></div>}</div>
}

export function Skyline() {
  // 浮点运算（Math.pow）在服务端和浏览器的末位可能不同，装饰图层只在客户端生成，避免 hydration 不一致
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? <SkylineArt /> : <svg className="lp-skyline" aria-hidden="true" />
}

function SkylineArt() {
  const buildings = useMemo(() => {
    const r = rng(1104)
    const make = (count: number, minH: number, maxH: number) => {
      let x = 0
      return Array.from({ length: count }, () => {
        const w = 1.2 + r() * 3.2, h = minH + r() ** 1.6 * (maxH - minH), b = { x, w, h, lit: Array.from({ length: Math.floor(h * w / 2.2) }, () => ({ x: .15 + Math.floor(r() * (w - .4) / .42) * .42, y: .4 + Math.floor(r() * (h - 1) / .6) * .6, on: r() })) }
        x += w + r() * .5
        return b
      }).filter(b => b.x < 100)
    }
    return { far: make(70, 10, 46), near: make(48, 6, 30) }
  }, [])
  return <svg className="lp-skyline" viewBox="0 0 100 60" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="lp-sky-fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0d1a33" stopOpacity="0" /><stop offset="1" stopColor="#0b1428" stopOpacity=".9" /></linearGradient></defs>
    <g className="far">{buildings.far.map((b, i) => <g key={i}><rect x={b.x} y={60 - b.h} width={b.w} height={b.h} />{b.lit.filter(l => l.on > .62).map((l, j) => <rect key={j} className={l.on > .985 ? 'win blink' : 'win'} x={b.x + l.x} y={60 - b.h + l.y} width=".16" height=".24" />)}</g>)}</g>
    <rect x="0" y="0" width="100" height="60" fill="url(#lp-sky-fade)" />
    <g className="near">{buildings.near.map((b, i) => <g key={i}><rect x={b.x} y={60 - b.h} width={b.w} height={b.h} />{b.lit.filter(l => l.on > .82).map((l, j) => <rect key={j} className="win" x={b.x + l.x} y={60 - b.h + l.y} width=".14" height=".2" />)}</g>)}</g>
  </svg>
}
