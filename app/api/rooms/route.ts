import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getClientIp, rateLimit } from "@/lib/rateLimit"
import { json, jsonError, parseJson } from "@/lib/api"

export const runtime = "nodejs"

const createRoomSchema = z.object({
  name: z.string().min(1).max(48),
  mode: z.literal("ROULETTE_VOTE").default("ROULETTE_VOTE"),
  options: z.array(z.string().min(1).max(48)).min(2).max(12),
  hostNickname: z.string().min(1).max(24).optional(),
  spectateOnlyLink: z.boolean().optional()
})

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`rooms:create:${ip}`, { limit: 6, intervalMs: 60_000 })
  if (!rl.ok) {
    return jsonError("Rate limited", 429, { retryAfterMs: rl.retryAfterMs })
  }

  const parsed = await parseJson(req, createRoomSchema)
  if (!parsed.ok) return jsonError("Invalid body", 400, { details: parsed.error })

  const { name, mode, options, hostNickname, spectateOnlyLink } = parsed.data
  const supabase = getSupabaseAdmin()

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({ name, mode, status: "LOBBY" })
    .select("*")
    .single()
  if (roomErr || !room) return jsonError("Failed to create room", 500)

  const { data: host, error: hostErr } = await supabase
    .from("participants")
    .insert({
      room_id: room.id,
      nickname: hostNickname ?? "Host",
      role: "HOST"
    })
    .select("*")
    .single()
  if (hostErr || !host) return jsonError("Failed to create host", 500)

  const optionRows = options.map((label, idx) => ({
    room_id: room.id,
    label: label.trim(),
    order_index: idx
  }))

  const { error: optErr } = await supabase.from("options").insert(optionRows)
  if (optErr) return jsonError("Failed to create options", 500)

  const { error: updateErr } = await supabase
    .from("rooms")
    .update({ host_participant_id: host.id })
    .eq("id", room.id)
  if (updateErr) return jsonError("Failed to finalize room", 500)

  await supabase.from("events").insert([
    { room_id: room.id, type: "ROOM_CREATED", payload: { name, mode } },
    { room_id: room.id, type: "PARTICIPANT_JOINED", payload: { id: host.id } }
  ])

  const origin = req.headers.get("origin") ?? ""
  const base = origin || req.headers.get("referer")?.split("/").slice(0, 3).join("/") || ""
  const roomUrl = `${base}/r/${room.id}`
  const spectateUrl = spectateOnlyLink ? `${roomUrl}?spectate=1` : roomUrl

  return json({
    ok: true,
    roomId: room.id,
    hostParticipantId: host.id,
    roomUrl,
    spectateUrl
  })
}

