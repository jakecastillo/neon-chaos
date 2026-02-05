"use client"

import * as React from "react"
import { Download, Link as LinkIcon, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import type { OptionRow } from "@/lib/models"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createShareCardDataUrl } from "@/lib/shareCard"

export function ResultCard({
  roomName,
  options,
  winnerOptionId,
  modifier,
  shareUrl,
  onRematch
}: {
  roomName: string
  options: OptionRow[]
  winnerOptionId: string
  modifier: string
  shareUrl?: string
  onRematch?: () => void
}) {
  const winner = options.find((o) => o.id === winnerOptionId)?.label ?? "Winner"
  const [dataUrl, setDataUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    let canceled = false
    createShareCardDataUrl({
      roomName,
      winnerLabel: winner,
      modifierText: modifier ? `HOUSE CHAOS: ${modifier}` : "HOUSE CHAOS"
    })
      .then((url) => {
        if (!canceled) setDataUrl(url)
      })
      .catch(() => {})
    return () => {
      canceled = true
    }
  }, [modifier, roomName, winner])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl ?? window.location.href)
      toast.success("Link copied")
    } catch {
      toast.error("Failed to copy")
    }
  }

  function download() {
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `neon-chaos-${Date.now()}.png`
    a.click()
  }

  return (
    <Card className="p-4">
      <div className="text-xs text-white/55">Result</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-cyan-100">
        {winner}
      </div>
      {modifier ? (
        <div className="mt-2 text-sm text-pink-200/90">
          HOUSE CHAOS: {modifier}
        </div>
      ) : null}

      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt="Shareable result card"
          className="mt-3 w-full rounded-2xl border border-white/10"
        />
      ) : (
        <div className="mt-3 h-56 w-full animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={copyLink}>
          <LinkIcon className="h-4 w-4" />
          Copy link
        </Button>
        <Button variant="secondary" onClick={download} disabled={!dataUrl}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      <div className="mt-2">
        <Button
          variant="ghost"
          disabled
          className="h-11 w-full border border-white/10 text-white/60"
        >
          Switch mode <span className="ml-2 text-[10px] opacity-70">soon</span>
        </Button>
      </div>

      {onRematch ? (
        <div className="mt-2">
          <Button className="w-full" onClick={onRematch}>
            <RotateCcw className="h-4 w-4" />
            Rematch
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
