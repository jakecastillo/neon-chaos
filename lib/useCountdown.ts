"use client"

import * as React from "react"

export function useCountdownSeconds(endsAtMs: number | null) {
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    if (!endsAtMs) return
    const t = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(t)
  }, [endsAtMs])

  if (!endsAtMs) return 0
  const remaining = Math.ceil((endsAtMs - now) / 1000)
  return Math.max(0, remaining)
}

