import * as PIXI from "pixi.js"
import type { ChaosModifier } from "@/lib/models"

export type RouletteQuality = "high" | "low"

export type RouletteSceneParams = {
  canvas: HTMLCanvasElement
  options: { id: string; label: string }[]
  quality: RouletteQuality
  reducedMotion: boolean
  forceCanvas?: boolean
}

export type RouletteRevealParams = {
  winnerIndex: number
  modifier: ChaosModifier | string
  seed: string
}

type SceneMode = "idle" | "spinning" | "done"

export class RouletteScene {
  private app: PIXI.Application
  private root = new PIXI.Container()
  private wheel = new PIXI.Container()
  private wheelGfx = new PIXI.Graphics()
  private labels = new PIXI.Container()
  private ball = new PIXI.Graphics()
  private overlay = new PIXI.Container()
  private chaosText = new PIXI.Text("")
  private labelTexts: PIXI.Text[] = []

  private mode: SceneMode = "idle"
  private options: { id: string; label: string }[] = []
  private quality: RouletteQuality
  private reducedMotion: boolean

  private t = 0
  private durationMs = 6500
  private chaosAtMs = 2600
  private winnerIndex = 0
  private modifier = ""
  private seed = ""

  private baseSpin = 0
  private targetAngle = 0
  private ballAngle = 0
  private shake = 0

  private particles: { gfx: PIXI.Graphics; vx: number; vy: number; life: number }[] =
    []

  constructor(params: RouletteSceneParams) {
    this.options = params.options
    this.quality = params.quality
    this.reducedMotion = params.reducedMotion

    const resolution = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
    const forceCanvas = Boolean(params.forceCanvas ?? false)

    // Headless + SwiftShader can report MAX_TEXTURE_IMAGE_UNITS=0 in some environments,
    // which triggers Pixi's max-if-statement probe to throw. Prefer legacy WebGL for stability.
    // If we're forcing canvas, do not touch PREFER_ENV (it can interfere with renderer selection).
    if (!forceCanvas) {
      try {
        ;(PIXI as any).settings.PREFER_ENV = (PIXI as any).ENV.WEBGL_LEGACY
      } catch {
        // ignore
      }
    }
    this.app = new PIXI.Application({
      view: params.canvas,
      forceCanvas,
      backgroundAlpha: 0,
      backgroundColor: 0x000000,
      antialias: true,
      autoDensity: true,
      resolution,
      powerPreference: "high-performance"
    })

    this.app.stage.addChild(this.root)
    this.root.addChild(this.wheel)
    this.wheel.addChild(this.wheelGfx)
    this.wheel.addChild(this.labels)
    this.root.addChild(this.ball)
    this.root.addChild(this.overlay)

    this.chaosText = new PIXI.Text("", {
      fontFamily:
        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      fontSize: 22,
      fill: 0xff5bd6,
      fontWeight: "700",
      letterSpacing: 1
    })
    this.chaosText.alpha = 0
    this.overlay.addChild(this.chaosText)

    this.drawStatic()
    this.resize(params.canvas.clientWidth, params.canvas.clientHeight)

    this.app.ticker.add((delta) => {
      this.update((delta / 60) * (1000 / 60))
      this.render()
    })

    document.addEventListener("visibilitychange", this.onVisibilityChange)
  }

  destroy() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange)
    // Important: do NOT remove the <canvas> from the DOM.
    // React StrictMode runs effect cleanup on initial mount in dev; removing the view would
    // permanently delete React-managed DOM and break hydration/tests.
    this.app.destroy(false, { children: true, texture: true, baseTexture: true })
  }

  setQuality(quality: RouletteQuality) {
    this.quality = quality
  }

  setOptions(options: { id: string; label: string }[]) {
    this.options = options
    this.drawStatic()
  }

  resize(width: number, height: number) {
    this.app.renderer.resize(Math.max(1, width), Math.max(1, height))
    const cx = width / 2
    const cy = height / 2
    this.root.position.set(cx, cy)

    const radius = Math.min(width, height) * 0.38
    this.wheel.scale.set(1)
    this.wheel.position.set(0, 0)
    this.wheelGfx.scale.set(1)

    this.ball.clear()
    this.ball.beginFill(0xffffff)
    this.ball.drawCircle(0, 0, Math.max(4, radius * 0.045))
    this.ball.endFill()
    this.ball.lineStyle(2, 0x00ffe5, 0.65)
    this.ball.drawCircle(0, 0, Math.max(4, radius * 0.045) + 2)

    this.chaosText.position.set(-radius, -radius - 36)
  }

  startReveal(params: RouletteRevealParams) {
    this.mode = "spinning"
    this.t = 0
    this.seed = params.seed
    this.winnerIndex = Math.max(0, Math.min(params.winnerIndex, this.options.length - 1))
    this.modifier = String(params.modifier ?? "")

    this.durationMs = this.reducedMotion ? 3200 : 6500
    this.chaosAtMs = this.reducedMotion ? 900 : 2600

    const n = Math.max(1, this.options.length)
    const seg = (Math.PI * 2) / n
    this.targetAngle = -Math.PI / 2 + (this.winnerIndex + 0.5) * seg

    this.baseSpin = (Math.PI * 2) * (this.reducedMotion ? 2.5 : 5.5)
    this.ballAngle = -Math.PI / 2
    this.chaosText.text = ""
    this.chaosText.alpha = 0
    this.particles = []
    this.shake = 0

    for (const t of this.labelTexts) t.alpha = 0.95
  }

  advanceTime(ms: number) {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)))
    for (let i = 0; i < steps; i++) {
      this.update(1000 / 60)
    }
    this.render()
  }

  getTextState() {
    return {
      mode: this.mode,
      tMs: Math.round(this.t),
      seed: this.seed,
      winnerIndex: this.winnerIndex,
      modifier: this.modifier,
      optionCount: this.options.length
    }
  }

  private update(dtMs: number) {
    if (this.mode !== "spinning") {
      this.updateParticles(dtMs)
      return
    }

    this.t += dtMs
    const p = Math.min(1, this.t / this.durationMs)

    const ease = 1 - Math.pow(1 - p, 3)
    const spin = this.baseSpin * (1 - ease)
    const settle = this.targetAngle
    this.ballAngle = settle + spin

    // Counter-rotate wheel a bit for energy.
    this.wheel.rotation = -spin * 0.12

    if (this.t >= this.chaosAtMs && this.chaosText.alpha < 0.99) {
      this.chaosText.text = this.modifier ? `HOUSE CHAOS: ${this.modifier}` : "HOUSE CHAOS"
      this.chaosText.alpha = 1
    }

    if (p >= 1) {
      this.mode = "done"
      this.chaosText.alpha = 1
      for (let i = 0; i < this.labelTexts.length; i++) {
        this.labelTexts[i]!.alpha = i === this.winnerIndex ? 1 : 0.35
      }
      this.spawnWinBurst()
      this.shake = this.reducedMotion ? 0 : 1
    }

    this.updateParticles(dtMs)
  }

  private render() {
    const w = this.app.renderer.width
    const h = this.app.renderer.height
    const radius = Math.min(w, h) * 0.38

    const shakeAmt = this.shake > 0 ? (Math.sin(this.t / 45) * 4 * this.shake) : 0
    this.root.position.set(w / 2 + shakeAmt, h / 2)
    this.shake = Math.max(0, this.shake - 0.012)

    const bx = Math.cos(this.ballAngle) * radius * 0.88
    const by = Math.sin(this.ballAngle) * radius * 0.88
    this.ball.position.set(bx, by)

    // Subtle ball glow by pulsing alpha in high quality.
    const glow = this.quality === "high" && !this.reducedMotion ? 0.65 + 0.25 * Math.sin(this.t / 120) : 0.65
    this.ball.alpha = glow
  }

  private drawStatic() {
    // Reset wheel container to avoid stacking pointer/children on redraw.
    this.wheel.removeChildren()
    this.wheel.addChild(this.wheelGfx)
    this.wheel.addChild(this.labels)

    this.wheelGfx.clear()
    this.labels.removeChildren()
    this.labelTexts = []

    const n = Math.max(1, this.options.length)
    const seg = (Math.PI * 2) / n

    const w = this.app.renderer.width || 1
    const h = this.app.renderer.height || 1
    const radius = Math.min(w, h) * 0.38

    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * seg
      const a1 = a0 + seg
      const hue = i / n
      const color = hsvToHex(0.52 + hue * 0.35, 0.9, 0.95)

      this.wheelGfx.beginFill(color, 0.18)
      this.wheelGfx.lineStyle(2, 0x00ffe5, 0.18)
      this.wheelGfx.moveTo(0, 0)
      this.wheelGfx.arc(0, 0, radius, a0, a1)
      this.wheelGfx.closePath()
      this.wheelGfx.endFill()

      const mid = (a0 + a1) / 2
      const tx = Math.cos(mid) * radius * 0.62
      const ty = Math.sin(mid) * radius * 0.62
      const label = this.options[i]?.label ?? `#${i + 1}`

      const t = new PIXI.Text(label, {
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        fontSize: 14,
        fill: 0xffffff,
        align: "center",
        fontWeight: "700"
      })
      t.anchor.set(0.5)
      t.position.set(tx, ty)
      t.rotation = mid + Math.PI / 2
      t.alpha = 0.9
      this.labels.addChild(t)
      this.labelTexts.push(t)
    }

    // Outer ring
    this.wheelGfx.lineStyle(5, 0x00ffe5, 0.22)
    this.wheelGfx.drawCircle(0, 0, radius)
    this.wheelGfx.lineStyle(3, 0xff5bd6, 0.16)
    this.wheelGfx.drawCircle(0, 0, radius * 0.8)

    // Pointer at top
    const pointer = new PIXI.Graphics()
    pointer.beginFill(0x00ffe5, 0.9)
    pointer.drawPolygon([0, -radius - 10, -10, -radius + 14, 10, -radius + 14])
    pointer.endFill()
    pointer.alpha = 0.9
    this.wheel.addChild(pointer)
  }

  private spawnWinBurst() {
    if (this.quality !== "high" || this.reducedMotion) return
    for (let i = 0; i < 28; i++) {
      const g = new PIXI.Graphics()
      const c = i % 2 === 0 ? 0x00ffe5 : 0xff5bd6
      g.beginFill(c, 0.9)
      g.drawCircle(0, 0, 3 + Math.random() * 3)
      g.endFill()
      g.position.set(0, 0)
      this.overlay.addChild(g)
      const a = (i / 28) * Math.PI * 2
      this.particles.push({
        gfx: g,
        vx: Math.cos(a) * (2.4 + Math.random() * 2.6),
        vy: Math.sin(a) * (2.4 + Math.random() * 2.6),
        life: 1100 + Math.random() * 600
      })
    }
  }

  private updateParticles(dtMs: number) {
    if (!this.particles.length) return
    for (const p of this.particles) {
      p.life -= dtMs
      p.gfx.x += p.vx
      p.gfx.y += p.vy
      p.vy += 0.02 * (dtMs / 16.6)
      p.gfx.alpha = Math.max(0, Math.min(1, p.life / 900))
    }
    const alive = this.particles.filter((p) => p.life > 0)
    for (const p of this.particles) {
      if (p.life <= 0) p.gfx.destroy()
    }
    this.particles = alive
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      this.app.ticker.stop()
    } else {
      this.app.ticker.start()
    }
  }
}

function hsvToHex(h: number, s: number, v: number) {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const mod = i % 6
  const r = [v, q, p, p, t, v][mod]!
  const g = [t, v, v, q, p, p][mod]!
  const b = [p, p, t, v, v, q][mod]!
  return (to255(r) << 16) + (to255(g) << 8) + to255(b)
}

function to255(x: number) {
  return Math.max(0, Math.min(255, Math.round(x * 255)))
}
