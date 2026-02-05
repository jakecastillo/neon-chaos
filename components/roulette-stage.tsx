"use client"

import * as React from "react"
import type { OptionRow, RoomRow } from "@/lib/models"
import { Card } from "@/components/ui/card"
import { PixiRoulette } from "@/components/pixi-roulette"

export function RouletteStage({
  room,
  options,
  votesByParticipantId
}: {
  room: RoomRow | null
  options: OptionRow[]
  votesByParticipantId: Record<string, string>
}) {
  const show =
    room?.status === "LOCKED" || room?.status === "RESULTS" || Boolean(room?.winner_option_id)
  const votes = React.useMemo(() => {
    const c: Record<string, number> = {}
    for (const opt of Object.values(votesByParticipantId)) c[opt] = (c[opt] ?? 0) + 1
    return c
  }, [votesByParticipantId])

  if (!show) return null

  const reveal =
    room?.winner_option_id && room?.seed_reveal
      ? {
          winnerOptionId: room.winner_option_id,
          modifier: room.chaos_modifier ?? "",
          seed: room.seed_reveal
        }
      : null

  return (
    <Card className="p-4">
      <div className="text-sm font-semibold text-white/85">Wheel</div>
      <div className="mt-1 text-xs text-white/60">
        {room?.status === "LOCKED"
          ? "Locked in. Waiting for the host to spin."
          : room?.winner_option_id
            ? "Result is in."
            : "Ready."}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <div className="aspect-square w-full">
          <PixiRoulette options={options} reveal={reveal} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/60">
        {options.slice(0, 6).map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="truncate">{o.label}</span>
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5">
              {votes[o.id] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
