"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Copy, DoorOpen, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRoomState } from "@/lib/realtime/useRoomState"
import { getStoredParticipantId, setStoredParticipantId } from "@/lib/localParticipant"
import { OptionChips } from "@/components/option-chips"
import { ParticipantList } from "@/components/participant-list"
import { BottomBar } from "@/components/bottom-bar"
import { RouletteStage } from "@/components/roulette-stage"
import { ResultCard } from "@/components/result-card"
import { QualityToggle } from "@/components/quality-toggle"
import { useCountdownSeconds } from "@/lib/useCountdown"

export default function RoomClient({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams()
  const spectate = (searchParams?.get("spectate") ?? "0") === "1"

  const state = useRoomState(roomId)
  const [myParticipantId, setMyParticipantId] = React.useState<string | null>(null)
  const [joinOpen, setJoinOpen] = React.useState(false)
  const [nickname, setNickname] = React.useState("")
  const [joining, setJoining] = React.useState(false)

  React.useEffect(() => {
    setMyParticipantId(getStoredParticipantId(roomId))
  }, [roomId])

  const room = state.room
  const myParticipant = state.participants.find((p) => p.id === myParticipantId) ?? null
  const isHost = Boolean(room?.host_participant_id && room?.host_participant_id === myParticipantId)
  const lockCountdown = useCountdownSeconds(state.lockCountdownEndsAtMs)
  const autoRevealOnce = React.useRef(false)

  async function copyLink() {
    try {
      const url = `${window.location.origin}/r/${roomId}?spectate=1`
      await navigator.clipboard.writeText(url)
      toast.success("Link copied")
    } catch {
      toast.error("Failed to copy")
    }
  }

  async function joinAsPlayer() {
    if (!nickname.trim()) return toast.error("Enter a nickname")
    setJoining(true)
    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), role: "PLAYER" })
      })
      const json = await res.json().catch(() => null)
      if (!json?.ok) return toast.error(json?.error ?? "Failed to join")
      setStoredParticipantId(roomId, json.participantId as string)
      setMyParticipantId(json.participantId as string)
      setJoinOpen(false)
      toast.success("Joined")
      state.refresh()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to join")
    } finally {
      setJoining(false)
    }
  }

  async function sendReaction(emoji: string) {
    try {
      await fetch(`/api/rooms/${roomId}/react`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emoji, participantId: myParticipantId ?? undefined })
      })
    } catch {
      // best-effort
    }
  }

  async function lockIn() {
    if (!myParticipantId) return toast.error("Host not found on this device")
    try {
      const res = await fetch(`/api/rooms/${roomId}/lock`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ participantId: myParticipantId, countdownSeconds: 5 })
      })
      const json = await res.json().catch(() => null)
      if (!json?.ok) return toast.error(json?.error ?? "Failed to lock")
      state.refresh()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to lock")
    }
  }

  async function reveal() {
    if (!myParticipantId) return toast.error("Host not found on this device")
    try {
      const res = await fetch(`/api/rooms/${roomId}/reveal`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ participantId: myParticipantId })
      })
      const json = await res.json().catch(() => null)
      if (!json?.ok) return toast.error(json?.error ?? "Failed to reveal")
      state.refresh()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reveal")
    }
  }

  React.useEffect(() => {
    if (!isHost) return
    if (room?.status !== "LOCKED") {
      autoRevealOnce.current = false
      return
    }
    if (room?.winner_option_id) return
    if (lockCountdown > 0) return
    if (autoRevealOnce.current) return
    autoRevealOnce.current = true
    void reveal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, lockCountdown, room?.status, room?.winner_option_id])

  async function rematch() {
    if (!myParticipantId) return toast.error("Host not found on this device")
    try {
      const res = await fetch(`/api/rooms/${roomId}/rematch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ participantId: myParticipantId })
      })
      const json = await res.json().catch(() => null)
      if (!json?.ok) return toast.error(json?.error ?? "Failed to rematch")
      state.refresh()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to rematch")
    }
  }

  async function placeVote(optionId: string) {
    if (!myParticipantId) return setJoinOpen(true)
    if (room?.status !== "LOBBY") return toast.error("Voting is closed")

    try {
      const res = await fetch(`/api/rooms/${roomId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ participantId: myParticipantId, optionId })
      })
      const json = await res.json().catch(() => null)
      if (!json?.ok) return toast.error(json?.error ?? "Failed to vote")
      state.refresh()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to vote")
    }
  }

  const canVote = Boolean(myParticipantId) && (room?.status ?? "LOBBY") === "LOBBY"

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 px-4 pb-[calc(92px+env(safe-area-inset-bottom))] pt-[calc(16px+env(safe-area-inset-top))]">
      <header className="flex items-start justify-between gap-3 pt-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {room?.name ?? "Room"}
            </h1>
            <Badge className="bg-white/10 text-white/70">Roulette Vote</Badge>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/55">
            <Users className="h-3.5 w-3.5" />
            <span>
              {state.participants.length} {state.participants.length === 1 ? "person" : "people"}
            </span>
            {myParticipant ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                You: {myParticipant.nickname}
              </span>
            ) : (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                Spectating
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <QualityToggle />
          <Button
            variant="secondary"
            className="h-10 w-10 px-0"
            onClick={copyLink}
            aria-label="Copy link"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {state.error ? (
        <Card className="p-4">
          <div className="text-sm text-white/80">{state.error}</div>
          <div className="mt-2 text-xs text-white/55">
            Check Supabase env vars and RLS policies.
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white/85">Options</div>
            <div className="text-xs text-white/60">
              Drop one chip. The house adds chaos.
            </div>
          </div>
          {!myParticipantId ? (
            <Button variant="secondary" className="h-10" onClick={() => setJoinOpen(true)}>
              <DoorOpen className="h-4 w-4" />
              Join
            </Button>
          ) : null}
        </div>

        <div className="mt-3">
          <OptionChips
            options={state.options}
            votesByParticipantId={state.votesByParticipantId}
            selectedOptionId={myParticipantId ? state.votesByParticipantId[myParticipantId] : undefined}
            disabled={!canVote}
            onSelect={placeVote}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {room?.status === "LOCKED" ? "Locked in" : room?.winner_option_id ? "Results" : "Lobby"}
            </span>
          </div>
          <div className="flex gap-2">
            {["🔥", "💀", "✨", "🤑"].map((e) => (
              <Button
                key={e}
                variant="ghost"
                className="h-10 w-10 border border-white/10 px-0 text-base"
                onClick={() => sendReaction(e)}
                aria-label={`React ${e}`}
              >
                {e}
              </Button>
            ))}
          </div>
        </div>

        {state.reactions.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {state.reactions.slice(-10).map((r, idx) => (
              <span
                key={`${r.at}-${idx}`}
                className="rounded-full bg-white/10 px-2 py-1 text-sm"
              >
                {r.emoji}
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      <ParticipantList participants={state.participants} />

      <RouletteStage
        room={room}
        options={state.options}
        votesByParticipantId={state.votesByParticipantId}
      />

      {room?.winner_option_id ? (
        <ResultCard
          roomName={room.name}
          options={state.options}
          winnerOptionId={room.winner_option_id}
          modifier={room.chaos_modifier ?? ""}
          shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/r/${roomId}?spectate=1`}
          onRematch={isHost ? rematch : undefined}
        />
      ) : null}

      <BottomBar
        roomStatus={room?.status ?? "LOBBY"}
        isHost={isHost}
        hasWinner={Boolean(room?.winner_option_id)}
        lockCountdownSeconds={lockCountdown}
        onLockIn={lockIn}
        onReveal={reveal}
        onRematch={rematch}
        onJoin={() => setJoinOpen(true)}
        canJoin={!myParticipantId}
      />

      {joinOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <Card className="w-full max-w-md p-4">
            <div className="text-sm font-semibold">Join to influence</div>
            <div className="mt-1 text-xs text-white/60">
              Pick a nickname. You get one chip per round.
            </div>
            <div className="mt-3 space-y-2">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nickname"
                autoFocus
              />
              <div className="flex gap-2">
                <Button className="w-full" disabled={joining} onClick={joinAsPlayer}>
                  {joining ? "Joining…" : "Join"}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setJoinOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  )
}
