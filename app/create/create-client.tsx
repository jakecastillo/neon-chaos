"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getTemplateById } from "@/lib/templates"
import { setStoredParticipantId } from "@/lib/localParticipant"

type CreateRoomResponse =
  | {
      ok: true
      roomId: string
      hostParticipantId: string
      roomUrl: string
      spectateUrl: string
    }
  | { ok: false; error: string }

export default function CreateRoomClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams?.get("template") ?? null
  const template = getTemplateById(templateId)

  const [roomName, setRoomName] = React.useState(template?.name ?? "Chaos Room")
  const [hostNickname, setHostNickname] = React.useState("Host")
  const [spectateOnlyLink, setSpectateOnlyLink] = React.useState(true)
  const [options, setOptions] = React.useState<string[]>(
    template?.options ?? ["Option A", "Option B", "Option C"]
  )
  const [busy, setBusy] = React.useState(false)

  function updateOption(i: number, next: string) {
    setOptions((prev) => prev.map((v, idx) => (idx === i ? next : v)))
  }

  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
  }

  function addOption() {
    setOptions((prev) =>
      [...prev, `Option ${String.fromCharCode(65 + prev.length)}`].slice(0, 12)
    )
  }

  async function onCreate() {
    const cleaned = options.map((o) => o.trim()).filter(Boolean)
    if (cleaned.length < 2) return toast.error("Add at least 2 options")
    if (cleaned.length > 12) return toast.error("Max 12 options")

    setBusy(true)
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: roomName.trim() || "Chaos Room",
          mode: "ROULETTE_VOTE",
          options: cleaned,
          hostNickname: hostNickname.trim() || "Host",
          spectateOnlyLink
        })
      })
      const json = (await res.json()) as CreateRoomResponse
      if (!json.ok) {
        toast.error(json.error ?? "Failed to create room")
        return
      }
      setStoredParticipantId(json.roomId, json.hostParticipantId)
      router.push(`/r/${json.roomId}`)
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create room")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-[calc(20px+env(safe-area-inset-top))]">
      <header className="space-y-1 pt-2">
        <div className="text-xs text-white/55">Create room</div>
        <h1 className="text-xl font-semibold tracking-tight">Set the chaos.</h1>
      </header>

      <Card className="space-y-3 p-4">
        <div className="space-y-1">
          <Label htmlFor="roomName">Room name</Label>
          <Input
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Friday Night Chaos"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="hostNickname">Your nickname</Label>
          <Input
            id="hostNickname"
            value={hostNickname}
            onChange={(e) => setHostNickname(e.target.value)}
            placeholder="Host"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <div className="text-sm font-medium text-white/85">
              Spectate-only link
            </div>
            <div className="text-xs text-white/60">
              Friends can watch instantly and choose to join.
            </div>
          </div>
          <Switch
            checked={spectateOnlyLink}
            onCheckedChange={setSpectateOnlyLink}
            aria-label="Spectate-only link"
          />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white/85">Options</div>
            <div className="text-xs text-white/60">2–12 chips on the wheel.</div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={addOption}
            disabled={options.length >= 12}
            className="h-10 px-3"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeOption(i)}
                disabled={options.length <= 2}
                className="h-12 w-12 px-0"
                aria-label="Remove option"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-auto space-y-2">
        <Button onClick={onCreate} disabled={busy} className="h-12 w-full">
          {busy ? "Creating…" : "Create room"}
        </Button>
        <Button
          variant="ghost"
          className="h-11 w-full border border-white/10"
          onClick={() => router.push("/")}
        >
          Back
        </Button>
      </div>
    </main>
  )
}
