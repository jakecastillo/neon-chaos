"use client"

import * as React from "react"

export type QualityMode = "auto" | "high" | "low"

type QualityState = {
  mode: QualityMode
  effective: Exclude<QualityMode, "auto">
  setMode: (mode: QualityMode) => void
}

const QualityContext = React.createContext<QualityState | null>(null)

const STORAGE_KEY = "nc:quality"

function getEffectiveQuality(mode: QualityMode): "high" | "low" {
  if (mode === "high" || mode === "low") return mode

  if (typeof window === "undefined") return "high"
  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches
  const deviceMemory = (navigator as any).deviceMemory as number | undefined

  if (prefersReducedMotion) return "low"
  if (typeof deviceMemory === "number" && deviceMemory <= 4) return "low"
  return "high"
}

export function QualityProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<QualityMode>("auto")
  const [effective, setEffective] = React.useState<"high" | "low">("high")

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as QualityMode | null
    if (saved === "auto" || saved === "high" || saved === "low") {
      setModeState(saved)
      setEffective(getEffectiveQuality(saved))
    } else {
      setEffective(getEffectiveQuality("auto"))
    }
  }, [])

  React.useEffect(() => {
    const update = () => setEffective(getEffectiveQuality(mode))
    update()
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    mql?.addEventListener?.("change", update)
    return () => mql?.removeEventListener?.("change", update)
  }, [mode])

  const setMode = React.useCallback((next: QualityMode) => {
    setModeState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const value = React.useMemo(
    () => ({ mode, effective, setMode }),
    [mode, effective, setMode]
  )

  return (
    <QualityContext.Provider value={value}>
      {children}
    </QualityContext.Provider>
  )
}

export function useQuality() {
  const ctx = React.useContext(QualityContext)
  if (!ctx) throw new Error("useQuality must be used within QualityProvider")
  return ctx
}

