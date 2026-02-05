export type ShareCardInput = {
  roomName: string
  winnerLabel: string
  modifierText: string
}

export async function createShareCardDataUrl(input: ShareCardInput) {
  const size = 1080
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas unsupported")

  // Background
  ctx.fillStyle = "#07070b"
  ctx.fillRect(0, 0, size, size)

  const grad = ctx.createRadialGradient(size * 0.25, size * 0.2, 10, size * 0.25, size * 0.2, size * 0.9)
  grad.addColorStop(0, "rgba(0,255,229,0.28)")
  grad.addColorStop(0.45, "rgba(255,0,196,0.16)")
  grad.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Scanlines
  ctx.globalAlpha = 0.12
  ctx.fillStyle = "rgba(255,255,255,0.12)"
  for (let y = 0; y < size; y += 6) ctx.fillRect(0, y, size, 1)
  ctx.globalAlpha = 1

  // Glass card
  const pad = 90
  const w = size - pad * 2
  const h = size - pad * 2
  roundRect(ctx, pad, pad, w, h, 48)
  ctx.fillStyle = "rgba(255,255,255,0.06)"
  ctx.fill()
  ctx.strokeStyle = "rgba(255,255,255,0.14)"
  ctx.lineWidth = 3
  ctx.stroke()

  // Neon border
  ctx.shadowColor = "rgba(0,255,229,0.55)"
  ctx.shadowBlur = 18
  ctx.strokeStyle = "rgba(0,255,229,0.35)"
  ctx.lineWidth = 4
  roundRect(ctx, pad + 6, pad + 6, w - 12, h - 12, 44)
  ctx.stroke()
  ctx.shadowBlur = 0

  // Text
  ctx.fillStyle = "rgba(255,255,255,0.85)"
  ctx.font = "600 46px ui-sans-serif, system-ui, -apple-system"
  ctx.fillText("NEON CHAOS", pad + 48, pad + 90)

  ctx.fillStyle = "rgba(255,255,255,0.65)"
  ctx.font = "500 30px ui-sans-serif, system-ui, -apple-system"
  wrapText(ctx, input.roomName, pad + 48, pad + 140, w - 96, 38, 2)

  ctx.fillStyle = "rgba(0,255,229,0.95)"
  ctx.font = "800 92px ui-sans-serif, system-ui, -apple-system"
  wrapText(ctx, input.winnerLabel, pad + 48, pad + 280, w - 96, 98, 3)

  ctx.fillStyle = "rgba(255,0,196,0.9)"
  ctx.font = "700 44px ui-sans-serif, system-ui, -apple-system"
  wrapText(ctx, input.modifierText, pad + 48, size - pad - 190, w - 96, 52, 2)

  ctx.fillStyle = "rgba(255,255,255,0.55)"
  ctx.font = "500 26px ui-sans-serif, system-ui, -apple-system"
  ctx.fillText("Play → Vote → Spin → Share → Rematch", pad + 48, size - pad - 90)

  return canvas.toDataURL("image/png")
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (ctx.measureText(next).width <= maxWidth) {
      cur = next
    } else {
      lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)

  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    ctx.fillText(lines[i] ?? "", x, y + i * lineHeight)
  }
}

