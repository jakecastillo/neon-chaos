"use client"

import * as React from "react"
import { Dice5, Lock, Play, RotateCcw, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { RoomStatus } from "@/lib/models"

export function BottomBar({
  roomStatus,
  isHost,
  hasWinner,
  lockCountdownSeconds,
  canJoin,
  onJoin,
  onLockIn,
  onReveal,
  onRematch
}: {
  roomStatus: RoomStatus
  isHost: boolean
  hasWinner: boolean
  lockCountdownSeconds?: number
  canJoin: boolean
  onJoin: () => void
  onLockIn: () => void
  onReveal: () => void
  onRematch: () => void
}) {
  const main = React.useMemo(() => {
    if (hasWinner) {
      return {
        label: "Rematch",
        icon: RotateCcw,
        onClick: onRematch,
        disabled: !isHost
      }
    }
    if (roomStatus === "LOBBY") {
      if (isHost) {
        return {
          label: "Lock In",
          icon: Lock,
          onClick: onLockIn,
          disabled: false
        }
      }
      return {
        label: canJoin ? "Join to Vote" : "Vote Above",
        icon: canJoin ? Users : Dice5,
        onClick: onJoin,
        disabled: !canJoin
      }
    }
    if (roomStatus === "LOCKED") {
      const countdown = lockCountdownSeconds ?? 0
      if (countdown > 0) {
        return {
          label: isHost ? `SPIN (${countdown})` : `Spinning in ${countdown}…`,
          icon: Play,
          onClick: onReveal,
          disabled: !isHost
        }
      }
      return {
        label: isHost ? "SPIN" : "Waiting…",
        icon: Play,
        onClick: onReveal,
        disabled: !isHost
      }
    }
    return {
      label: isHost ? "SPIN" : "Revealing…",
      icon: Play,
      onClick: onReveal,
      disabled: true
    }
  }, [canJoin, hasWinner, isHost, lockCountdownSeconds, onJoin, onLockIn, onRematch, onReveal, roomStatus])

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2">
      <div className="rounded-3xl border border-white/10 bg-black/55 p-2 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <Button
          className="h-14 w-full text-base font-semibold tracking-tight"
          onClick={main.onClick}
          disabled={main.disabled}
        >
          <main.icon className="h-5 w-5" />
          {main.label}
        </Button>
      </div>
    </div>
  )
}
