"use client"

import * as React from "react"
import { Gauge, GaugeCircle, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuality, type QualityMode } from "@/lib/quality"

const order: QualityMode[] = ["auto", "high", "low"]

function label(mode: QualityMode) {
  if (mode === "auto") return "Auto"
  if (mode === "high") return "High"
  return "Low"
}

export function QualityToggle() {
  const { mode, effective, setMode } = useQuality()

  const next = React.useCallback(() => {
    const idx = order.indexOf(mode)
    setMode(order[(idx + 1) % order.length] ?? "auto")
  }, [mode, setMode])

  const Icon = mode === "auto" ? Wand2 : mode === "high" ? GaugeCircle : Gauge

  return (
    <Button
      variant="secondary"
      className="h-10 gap-1.5 px-3"
      onClick={next}
      aria-label={`Quality: ${label(mode)} (effective: ${effective})`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label(mode)}</span>
    </Button>
  )
}
