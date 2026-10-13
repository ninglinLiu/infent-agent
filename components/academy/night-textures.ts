import * as THREE from 'three'

// System CJK stacks: Japanese faces first so kanji keep Japanese glyph shapes, Chinese faces last.
export const GOTHIC = '"Yu Gothic UI", "Yu Gothic", YuGothic, "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, "Noto Sans CJK JP", "Noto Sans JP", "Microsoft YaHei", sans-serif'
export const MINCHO = '"Yu Mincho", YuMincho, "Hiragino Mincho ProN", "Noto Serif CJK JP", "Noto Serif JP", "Noto Serif SC", SimSun, serif'
export const KAI = 'KaiTi, STKaiti, "Kaiti SC", "Noto Serif CJK SC", "Noto Serif SC", SimSun, serif'

export type BoardStyle = 'neon' | 'light' | 'plate' | 'wood' | 'paper' | 'chalk'
export type Board = { title: string; sub?: string; color: string; style?: BoardStyle; ink?: string; vertical?: boolean; lines?: string; font?: string; ppu?: number }

type Ctx = CanvasRenderingContext2D
const ROTATED = new Set(['ー', '〜', '～', '…', '－', '-', '→'])

function canvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  return [c, c.getContext('2d')!]
}

export function texture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

export function mix(hex: string, to: string, k: number) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16)
  return `rgb(${[16, 8, 0].map(s => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k)).join(',')})`
}

function rng(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
}

/** Lays out characters one by one so CJK spacing stays even and vertical writing can rotate long marks. */
function run(x: Ctx, text: string, cx: number, cy: number, size: number, gap: number, vertical: boolean, draw: (ch: string, X: number, Y: number) => void) {
  const chars = Array.from(text)
  const widths = chars.map(ch => vertical ? size : x.measureText(ch).width)
  const total = widths.reduce((s, w) => s + w, 0) + gap * (chars.length - 1)
  let at = (vertical ? cy : cx) - total / 2
  chars.forEach((ch, i) => {
    const mid = at + widths[i] / 2
    if (vertical && ROTATED.has(ch)) { x.save(); x.translate(cx, mid); x.rotate(Math.PI / 2); draw(ch, 0, 0); x.restore() }
    else if (vertical) draw(ch, cx, mid)
    else draw(ch, mid, cy)
    at += widths[i] + gap
  })
}

function runLength(x: Ctx, text: string, size: number, gap: number, vertical: boolean) {
  const chars = Array.from(text)
  return (vertical ? chars.length * size : chars.reduce((s, ch) => s + x.measureText(ch).width, 0)) + gap * (chars.length - 1)
}

/** Largest font size (up to max) whose run fits within span. */
function fit(x: Ctx, text: string, font: string, weight: number, max: number, span: number, gapRatio: number, vertical: boolean) {
  x.font = `${weight} ${max}px ${font}`
  const length = runLength(x, text, max, max * gapRatio, vertical)
  const size = length > span ? max * span / length : max
  x.font = `${weight} ${size}px ${font}`
  return size
}

function neon(x: Ctx, color: string, size: number) {
  return (ch: string, X: number, Y: number) => {
    x.save(); x.fillStyle = color; x.shadowColor = color
    x.globalAlpha = .55; x.shadowBlur = size * .42; x.fillText(ch, X, Y)
    x.globalAlpha = .95; x.shadowBlur = size * .14; x.fillText(ch, X, Y)
    x.globalAlpha = 1; x.shadowBlur = size * .04; x.fillStyle = mix(color, '#ffffff', .62); x.fillText(ch, X, Y)
    x.restore()
  }
}

function plain(x: Ctx, ink: string, shadow?: string, offset = 0) {
  return (ch: string, X: number, Y: number) => {
    if (shadow) { x.fillStyle = shadow; x.fillText(ch, X + offset, Y + offset) }
    x.fillStyle = ink; x.fillText(ch, X, Y)
  }
}

function grain(x: Ctx, w: number, h: number, base: string, seed: number, lines = 70) {
  const r = rng(seed)
  x.fillStyle = base; x.fillRect(0, 0, w, h)
  for (let i = 0; i < lines; i++) {
    const y = r() * h, a = .05 + r() * .12
    x.strokeStyle = r() > .5 ? `rgba(0,0,0,${a})` : `rgba(255,230,190,${a * .6})`
    x.lineWidth = 1 + r() * 3
    x.beginPath(); x.moveTo(0, y)
    for (let X = 0; X <= w; X += w / 8) x.lineTo(X, y + Math.sin(X / w * 6 + i) * h * .012)
    x.stroke()
  }
}

/** Sign faces: neon tubes, lit acrylic boxes, painted plates, carved wood, red paper and chalkboards. */
export function boardTexture(b: Board, size: [number, number]) {
  // Pixels per world unit, raised for tiny faces and capped for huge ones, always keeping the face's aspect.
  const k = Math.min(Math.max(b.ppu ?? 440, 128 / size[1], 160 / size[0]), 2048 / Math.max(size[0], size[1]))
  const W = Math.round(size[0] * k), H = Math.round(size[1] * k)
  const [c, x] = canvas(W, H), m = Math.min(W, H), style = b.style ?? 'neon'
  x.textAlign = 'center'; x.textBaseline = 'middle'
  const font = b.font ?? (style === 'wood' ? MINCHO : style === 'paper' ? KAI : GOTHIC)
  const weight = style === 'paper' || style === 'wood' ? 700 : style === 'neon' ? 600 : 700
  let draw = (size: number) => plain(x, b.ink ?? '#16181d')

  if (style === 'neon') {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, mix('#0a111c', b.color, .1)); g.addColorStop(1, '#060a12')
    x.fillStyle = g; x.fillRect(0, 0, W, H)
    const inset = m * .07, line = Math.max(3, m * .022)
    for (const [alpha, blur, color, width] of [[.5, m * .12, b.color, line * 1.4], [1, m * .03, b.color, line], [1, 0, mix(b.color, '#ffffff', .55), line * .42]] as const) {
      x.save(); x.globalAlpha = alpha; x.shadowColor = b.color; x.shadowBlur = blur; x.strokeStyle = color; x.lineWidth = width
      x.beginPath(); x.roundRect(inset, inset, W - inset * 2, H - inset * 2, m * .08); x.stroke(); x.restore()
    }
    draw = size => neon(x, b.color, size)
  } else if (style === 'light') {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, mix(b.color, '#ffffff', .3)); g.addColorStop(.5, b.color); g.addColorStop(1, mix(b.color, '#000000', .12))
    x.fillStyle = g; x.fillRect(0, 0, W, H)
    x.strokeStyle = 'rgba(20,22,28,.85)'; x.lineWidth = m * .07; x.strokeRect(0, 0, W, H)
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = Math.max(2, m * .012); x.strokeRect(m * .07, m * .07, W - m * .14, H - m * .14)
  } else if (style === 'plate') {
    x.fillStyle = b.color; x.fillRect(0, 0, W, H)
    x.strokeStyle = mix(b.ink ?? '#ffffff', b.color, .35); x.lineWidth = Math.max(2, m * .03); x.strokeRect(m * .06, m * .06, W - m * .12, H - m * .12)
  } else if (style === 'wood') {
    grain(x, W, H, b.color, W + H)
    x.strokeStyle = 'rgba(25,12,5,.55)'; x.lineWidth = m * .07; x.strokeRect(0, 0, W, H)
    draw = () => plain(x, b.ink ?? '#f4e6c8', 'rgba(20,8,0,.75)', Math.max(1.5, m * .012))
  } else if (style === 'paper') {
    x.fillStyle = b.color; x.fillRect(0, 0, W, H)
    const r = rng(W * 7 + H)
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${r() > .5 ? '255,180,120' : '60,0,0'},${r() * .08})`; x.fillRect(r() * W, r() * H, 2 + r() * m * .08, 2 + r() * m * .05) }
    x.strokeStyle = 'rgba(244,200,93,.75)'; x.lineWidth = Math.max(2, m * .025); x.strokeRect(m * .05, m * .05, W - m * .1, H - m * .1)
    draw = () => plain(x, b.ink ?? '#1a1210', 'rgba(0,0,0,.25)', Math.max(1, m * .008))
  } else {
    grain(x, W, H, '#6e4a2c', 11, 30)
    const g = x.createRadialGradient(W * .5, H * .45, 0, W * .5, H * .45, Math.max(W, H) * .7); g.addColorStop(0, '#2c4a3d'); g.addColorStop(1, '#17271f')
    x.fillStyle = g; x.fillRect(m * .07, m * .07, W - m * .14, H - m * .14)
    const r = rng(5)
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${r() * .04})`; x.fillRect(r() * W, r() * H, r() * W * .3, r() * H * .05) }
    draw = () => plain(x, b.ink ?? 'rgba(244,241,229,.92)')
  }

  const pad = m * (style === 'neon' ? .2 : .14)
  if (b.lines) {
    const rows = b.lines.split('\n'), titleSize = fit(x, b.title, font, weight, H * .13, W - pad * 2, .08, false)
    run(x, b.title, W / 2, H * .17, titleSize, titleSize * .08, false, draw(titleSize))
    x.fillStyle = b.ink ?? 'rgba(244,241,229,.6)'; x.fillRect(W * .18, H * .27, W * .64, Math.max(2, H * .006))
    const rowSize = Math.min(...rows.map(row => fit(x, row, font, 500, H * .085, W - pad * 2.2, .02, false)))
    x.textAlign = 'left'; x.font = `500 ${rowSize}px ${font}`
    rows.forEach((row, i) => draw(rowSize)(row, pad * 1.1, H * (.4 + i * .16)))
  } else if (b.vertical) {
    const columns = b.sub ? [b.title, b.sub] : [b.title]
    const titleSize = fit(x, b.title, font, weight, W * (b.sub ? .52 : .66), H - pad * 2, .12, true)
    run(x, b.title, b.sub ? W * .6 : W / 2, H / 2, titleSize, titleSize * .12, true, draw(titleSize))
    if (columns[1]) {
      const subSize = fit(x, columns[1], font, 500, W * .2, H - pad * 2.4, .1, true)
      run(x, columns[1], W * .22, H / 2, subSize, subSize * .1, true, draw(subSize))
    }
  } else {
    const titleSize = fit(x, b.title, font, weight, H * (b.sub ? .44 : .58), W - pad * 2, .1, false)
    run(x, b.title, W / 2, b.sub ? H * .42 : H * .52, titleSize, titleSize * .1, false, draw(titleSize))
    if (b.sub) {
      const subSize = fit(x, b.sub, font, 500, H * .15, W - pad * 2.4, .14, false)
      run(x, b.sub, W / 2, H * .76, subSize, subSize * .14, false, draw(subSize))
    }
  }
  return texture(c)
}

/** Lathe UVs wrap u around the lantern; u = .5 faces +z, so text is drawn at the centre and on the seam. */
export function lanternTexture(text: string, kind: 'chochin' | 'red' | 'china') {
  const W = 1024, H = 512, [c, x] = canvas(W, H)
  const paper = kind === 'chochin' ? '#f3e7cf' : kind === 'red' ? '#c8262b' : '#d0201f'
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, mix(paper, '#000000', .2)); g.addColorStop(.5, mix(paper, '#ffffff', .12)); g.addColorStop(1, mix(paper, '#000000', .2))
  x.fillStyle = g; x.fillRect(0, 0, W, H)
  if (kind === 'china') {
    x.strokeStyle = 'rgba(255,205,90,.55)'; x.lineWidth = 3
    for (let i = 0; i < 16; i++) { x.beginPath(); x.moveTo(i * W / 16, 0); x.lineTo(i * W / 16, H); x.stroke() }
  } else {
    x.strokeStyle = 'rgba(60,30,10,.28)'; x.lineWidth = 3
    for (let i = 1; i < 16; i++) { x.beginPath(); x.moveTo(0, i * H / 16); x.lineTo(W, i * H / 16); x.stroke() }
  }
  x.textAlign = 'center'; x.textBaseline = 'middle'
  const ink = kind === 'china' ? '#ffd36b' : '#17110f', font = kind === 'china' ? KAI : MINCHO
  for (const cx of [W / 2, 0, W]) {
    if (kind === 'china') {
      x.fillStyle = 'rgba(120,0,0,.35)'; x.beginPath(); x.arc(cx, H / 2, H * .3, 0, Math.PI * 2); x.fill()
      x.strokeStyle = ink; x.lineWidth = 6; x.stroke()
      x.font = `700 ${H * .42}px ${font}`; x.fillStyle = ink; x.fillText(text, cx, H * .52)
    } else {
      const chars = Array.from(text).length, size = Math.min(W * .1, H * .8 / chars)
      x.font = `700 ${size}px ${font}`
      run(x, text, cx, H / 2, size, size * .04, true, plain(x, ink))
    }
  }
  return texture(c)
}

const tiles = new Map<string, THREE.CanvasTexture>()

/** Shared greyscale surface detail, multiplied by each material's colour. */
export function surfaceTexture(kind: 'tile' | 'pave' | 'wood' | 'puddle') {
  const cached = tiles.get(kind)
  if (cached) return cached
  const [c, x] = canvas(256, 256), r = rng(kind.length * 31)
  if (kind === 'tile') {
    x.fillStyle = '#7d7d7d'; x.fillRect(0, 0, 256, 256)
    for (let row = 0; row < 16; row++) for (let col = 0; col < 5; col++) {
      const v = 205 + r() * 50, off = row % 2 ? 25 : 0
      x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(col * 51 + off - 25, row * 16 + 1.5, 48, 13)
      x.fillRect(col * 51 + off + 230, row * 16 + 1.5, 48, 13)
    }
  } else if (kind === 'pave') {
    x.fillStyle = '#5c5c5c'; x.fillRect(0, 0, 256, 256)
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const v = 170 + r() * 70
      x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(col * 64 + 2, row * 64 + 2, 60, 60)
      x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(col * 64 + 2, row * 64 + 2, 60, 4)
    }
  } else if (kind === 'wood') {
    grain(x, 256, 256, '#d8d8d8', 3, 90)
  } else {
    x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 26; i++) {
      const X = r() * 256, Y = r() * 256, R = 10 + r() * 34
      const g = x.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, 'rgba(20,20,20,.95)'); g.addColorStop(1, 'rgba(20,20,20,0)')
      x.fillStyle = g; x.fillRect(X - R, Y - R, R * 2, R * 2)
    }
  }
  const t = texture(c, kind !== 'puddle'); t.wrapS = t.wrapT = THREE.RepeatWrapping
  tiles.set(kind, t)
  return t
}

let soft: THREE.Texture | null = null
export function softTexture() {
  if (soft) return soft
  const [c, x] = canvas(128, 128), g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(.2, 'rgba(255,255,255,.26)'); g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g; x.fillRect(0, 0, 128, 128)
  return soft = texture(c, false)
}

/** Paper screen with lattice and the shadow of someone reading late. */
export function shojiTexture() {
  const W = 1024, H = 610, [c, x] = canvas(W, H)
  const g = x.createRadialGradient(W * .42, H * .55, 20, W * .5, H * .5, W * .7); g.addColorStop(0, '#fff1d2'); g.addColorStop(1, '#d9a774')
  x.fillStyle = g; x.fillRect(0, 0, W, H)
  x.save(); x.fillStyle = 'rgba(70,36,20,.5)'; x.shadowColor = 'rgba(70,36,20,.5)'; x.shadowBlur = 22
  x.beginPath(); x.arc(W * .3, H * .38, 52, 0, Math.PI * 2); x.fill()
  x.beginPath(); x.moveTo(W * .2, H); x.quadraticCurveTo(W * .2, H * .5, W * .3, H * .48); x.quadraticCurveTo(W * .42, H * .5, W * .43, H); x.fill()
  x.beginPath(); x.moveTo(W * .36, H * .66); x.lineTo(W * .5, H * .58); x.lineTo(W * .52, H * .7); x.lineTo(W * .4, H * .76); x.fill()
  x.beginPath(); x.ellipse(W * .76, H * .86, 60, 38, 0, 0, Math.PI * 2); x.fill()
  x.beginPath(); x.arc(W * .82, H * .74, 30, 0, Math.PI * 2); x.fill()
  x.beginPath(); x.moveTo(W * .8, H * .7); x.lineTo(W * .805, H * .64); x.lineTo(W * .82, H * .7); x.moveTo(W * .83, H * .7); x.lineTo(W * .845, H * .64); x.lineTo(W * .85, H * .71); x.fill()
  x.restore()
  x.fillStyle = '#4a2c1c'
  for (let i = 0; i <= 8; i++) x.fillRect(i * W / 8 - 5, 0, 10, H)
  for (let i = 0; i <= 5; i++) x.fillRect(0, i * H / 5 - 5, W, 10)
  x.strokeStyle = '#2d190f'; x.lineWidth = 26; x.strokeRect(0, 0, W, H)
  return texture(c)
}

/** Illustrated course packs with quiet shelves instead of an overexposed drink display. */
export function lessonsTexture() {
  const W = 640, H = 900, [c, x] = canvas(W, H)
  x.fillStyle = '#192934'; x.fillRect(0, 0, W, H)
  const rows = [
    { title: '01  VALUE', colors: ['#d9af77', '#c58c66', '#debfa0'] },
    { title: '02  RISK', colors: ['#77a7a1', '#638d8b', '#a0bdb1'] },
    { title: '03  EVIDENCE', colors: ['#a693b1', '#807d9e', '#b0a5bf'] },
  ]
  x.textAlign = 'center'; x.textBaseline = 'middle'
  rows.forEach((row, j) => {
    const y = 24 + j * 294
    row.colors.forEach((color, i) => {
      const cx = 119 + i * 201
      x.fillStyle = color; x.beginPath(); x.roundRect(cx - 62, y + 25, 124, 182, 8); x.fill()
      x.fillStyle = 'rgba(0,0,0,.16)'; x.fillRect(cx - 55, y + 25, 9, 182)
      x.fillStyle = '#f7ebd8'; x.fillRect(cx - 32, y + 83, 66, 5); x.fillRect(cx - 32, y + 98, 48, 4)
      x.font = '500 26px sans-serif'; x.fillText(String(i + 1).padStart(2, '0'), cx, y + 151)
    })
    x.fillStyle = '#394a55'; x.fillRect(14, y + 217, W - 28, 6)
    x.fillStyle = '#e4cfaa'; x.font = '600 30px sans-serif'; x.fillText(row.title, W / 2, y + 254)
  })
  return texture(c)
}
