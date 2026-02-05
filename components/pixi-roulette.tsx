"use client"

import * as React from "react"
import { useQuality } from "@/lib/quality"
import { RouletteScene, type RouletteQuality } from "@/game/roulette/scene"
import type { OptionRow } from "@/lib/models"

export function PixiRoulette({
  options,
  reveal,
  exposeTestHooks
}: {
  options: OptionRow[]
  reveal:
    | null
    | {
        winnerOptionId: string
        modifier: string
        seed: string
      }
  exposeTestHooks?: boolean
}) {
  const { effective } = useQuality()
  const reducedMotion = React.useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  }, [])

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const sceneRef = React.useRef<RouletteScene | null>(null)
  const lastRevealKey = React.useRef<string>("")

  const quality: RouletteQuality = effective === "low" ? "low" : "high"

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let ro: ResizeObserver | null = null
    let scene: RouletteScene | null = null
    let canceled = false

    const init = async () => {
      if (canceled) return

      scene = new RouletteScene({
        canvas,
        options: options.map((o) => ({ id: o.id, label: o.label })),
        quality,
        reducedMotion,
        forceCanvas: false
      })
      sceneRef.current = scene

      ro = new ResizeObserver((entries) => {
        const r = entries[0]?.contentRect
        if (!r) return
        scene?.resize(r.width, r.height)
      })
      const parent = canvas.parentElement
      if (parent) ro.observe(parent)

      if (exposeTestHooks) {
        ;(window as any).advanceTime = (ms: number) => {
          scene?.advanceTime(ms)
          return Promise.resolve()
        }
        ;(window as any).render_game_to_text = () =>
          JSON.stringify(scene?.getTextState() ?? {})
      }
    }

    void init()

    return () => {
      canceled = true
      ro?.disconnect()
      ro = null
      if (exposeTestHooks) {
        delete (window as any).advanceTime
        delete (window as any).render_game_to_text
      }
      scene?.destroy()
      scene = null
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    sceneRef.current?.setQuality(quality)
  }, [quality])

  React.useEffect(() => {
    sceneRef.current?.setOptions(options.map((o) => ({ id: o.id, label: o.label })))
  }, [options])

  React.useEffect(() => {
    const scene = sceneRef.current
    if (!scene || !reveal) return
    const winnerIndex = options.findIndex((o) => o.id === reveal.winnerOptionId)
    const key = `${reveal.seed}:${reveal.winnerOptionId}:${reveal.modifier}`
    if (key === lastRevealKey.current) return
    lastRevealKey.current = key
    scene.startReveal({
      winnerIndex: Math.max(0, winnerIndex),
      modifier: reveal.modifier,
      seed: reveal.seed
    })
  }, [options, reveal])

  return <canvas ref={canvasRef} className="h-full w-full" />
}
