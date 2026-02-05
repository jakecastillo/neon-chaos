import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getClientIp, rateLimit } from "@/lib/rateLimit"
import { json, jsonError, parseJson } from "@/lib/api"

export const runtime = "nodejs"

const joinSchema = z.object({
  nickname: z.string().min(1).max(24),
  role: z.enum(["PLAYER", "SPECTATOR"]).default("PLAYER")
})

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const ip = getClientIp(req)
  const rl = rateLimit(`rooms:join:${ip}`, { limit: 20, intervalMs: 60_000 })
  if (!rl.ok) return jsonError("Rate limited", 429, { retryAfterMs: rl.retryAfterMs })

  const parsed = await parseJson(req, joinSchema)
  if (!parsed.ok) return jsonError("Invalid body", 400, { details: parsed.error })

  const roomId = ctx.params.id
  const supabase = getSupabaseAdmin()

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .single()
  if (roomErr || !room) return jsonError("Room not found", 404)

  const { data: participant, error } = await supabase
    .from("participants")
    .insert({
      room_id: roomId,
      nickname: parsed.data.nickname.trim(),
      role: parsed.data.role
    })
    .select("*")
    .single()
  if (error || !participant) return jsonError("Failed to join", 500)

  await supabase
    .from("events")
    .insert({ room_id: roomId, type: "PARTICIPANT_JOINED", payload: { id: participant.id } })

  return json({ ok: true, participantId: participant.id })
}

