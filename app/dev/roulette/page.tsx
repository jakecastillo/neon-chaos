"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PixiRoulette } from "@/components/pixi-roulette"
import { useQuality } from "@/lib/quality"

const options = [
  { id: "a", room_id: "dev", label: "Tacos", order_index: 0, created_at: "" },
  { id: "b", room_id: "dev", label: "Sushi", order_index: 1, created_at: "" },
  { id: "c", room_id: "dev", label: "Pizza", order_index: 2, created_at: "" },
  { id: "d", room_id: "dev", label: "Burgers", order_index: 3, created_at: "" },
  { id: "e", room_id: "dev", label: "Ramen", order_index: 4, created_at: "" },
  { id: "f", room_id: "dev", label: "Thai", order_index: 5, created_at: "" }
]

export default function DevRoulettePage() {
  const { setMode } = useQuality()
  const [reveal, setReveal] = React.useState<null | { winnerOptionId: string; modifier: string; seed: string }>(null)

  React.useEffect(() => {
    // Make screenshots/test runs stable by defaulting to low.
    setMode("low")
  }, [setMode])

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-[calc(20px+env(safe-area-inset-top))]">
      <Card className="p-4">
        <div className="text-sm font-semibold text-white/85">Dev: Roulette</div>
        <div className="mt-1 text-xs text-white/60">
          Exposes <code className="rounded bg-white/10 px-1">window.advanceTime</code> and{" "}
          <code className="rounded bg-white/10 px-1">window.render_game_to_text</code>.
        </div>
      </Card>

      <Card className="p-4">
        <div className="aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <PixiRoulette options={options} reveal={reveal} exposeTestHooks />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            id="spin-btn"
            onClick={() =>
              setReveal({
                winnerOptionId: "c",
                modifier: "Lucky7",
                seed: "dev-seed-0001"
              })
            }
          >
            SPIN
          </Button>
          <Button variant="secondary" onClick={() => setReveal(null)}>
            Reset
          </Button>
        </div>
      </Card>
    </main>
  )
}

