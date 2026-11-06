import { AsciiRenderer } from './renderer'
import { World } from './world'

/** Decorative adaptation of ascii-sharks. No pointer handlers or network calls. */
export class AgentOcean {
  private world = new World([{ kind: 'classic', size: 1 }, { kind: 'hammerhead', size: .78 }], 42)
  private renderer: AsciiRenderer
  private frameId = 0
  private last = 0
  private visible = false
  private paused = false
  private destroyed = false
  private motion = matchMedia('(prefers-reduced-motion: reduce)')
  private resizeObserver: ResizeObserver
  private intersectionObserver: IntersectionObserver

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new AsciiRenderer(canvas)
    this.renderer.setFontFamily('ui-monospace, Consolas, monospace')
    this.resizeObserver = new ResizeObserver(this.resize)
    this.resizeObserver.observe(canvas)
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting
      this.sync()
    })
    this.intersectionObserver.observe(canvas)
    this.motion.addEventListener('change', this.sync)
    document.addEventListener('visibilitychange', this.sync)
    this.resize()
  }

  setPaused(paused: boolean) {
    this.paused = paused
    this.sync()
  }

  private resize = () => {
    const { width, height } = this.canvas.getBoundingClientRect()
    if (width < 1 || height < 1) return
    this.renderer.resize(width, height, Math.min(devicePixelRatio || 1, 1.5))
    this.world.resize(width, height, this.renderer.cellWidth, this.renderer.cellHeight)
    if (this.world.time === 0) {
      for (let i = 0; i < 120; i++) this.world.step(1 / 60)
    }
    this.renderer.render(this.world, 0)
  }

  private sync = () => {
    cancelAnimationFrame(this.frameId)
    if (this.destroyed || !this.visible || this.paused || this.motion.matches || document.hidden) return
    this.last = performance.now()
    this.frameId = requestAnimationFrame(this.frame)
  }

  private frame = (now: number) => {
    // A quiet background: cap drawing at 24fps and swimming at half speed.
    if (now - this.last >= 1000 / 24) {
      const elapsed = Math.min((now - this.last) / 1000, .1) * .55
      const steps = Math.ceil(elapsed / (1 / 60))
      for (let i = 0; i < steps; i++) this.world.step(elapsed / steps)
      this.renderer.render(this.world, elapsed)
      this.last = now
    }
    this.frameId = requestAnimationFrame(this.frame)
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    this.intersectionObserver.disconnect()
    this.motion.removeEventListener('change', this.sync)
    document.removeEventListener('visibilitychange', this.sync)
  }
}
