"use client"

import * as React from "react"
import type { OptionRow } from "@/lib/models"
import { cn } from "@/lib/utils"

export function OptionChips({
  options,
  votesByParticipantId,
  selectedOptionId,
  disabled,
  onSelect
}: {
  options: OptionRow[]
  votesByParticipantId: Record<string, string>
  selectedOptionId?: string
  disabled?: boolean
  onSelect: (optionId: string) => void
}) {
  const counts = React.useMemo(() => {
    const c: Record<string, number> = {}
    for (const opt of Object.values(votesByParticipantId)) c[opt] = (c[opt] ?? 0) + 1
    return c
  }, [votesByParticipantId])

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const selected = o.id === selectedOptionId
        const count = counts[o.id] ?? 0
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(o.id)}
            className={cn(
              "relative flex min-h-[48px] w-full items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-left text-sm",
              "active:scale-[0.99] disabled:opacity-60",
              selected
                ? "border-cyan-400/50 bg-cyan-500/15 shadow-[0_0_24px_rgba(0,255,229,0.18)]"
                : "border-white/10 bg-black/20 hover:bg-white/5"
            )}
          >
            <span className={cn("font-medium", selected ? "text-cyan-100" : "text-white/85")}>
              {o.label}
            </span>
            <span className={cn("rounded-full px-2 py-1 text-xs", selected ? "bg-cyan-400/15 text-cyan-200" : "bg-white/10 text-white/70")}>
              {count}
            </span>
            {selected ? (
              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-cyan-400/30 animate-pulse-glow" />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

