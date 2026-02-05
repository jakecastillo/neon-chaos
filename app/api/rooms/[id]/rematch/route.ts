import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getClientIp, rateLimit } from "@/lib/rateLimit"
import { json, jsonError, parseJson } from "@/lib/api"

export const runtime = "nodejs"

const rematchSchema = z.object({
  participantId: z.string().uuid()
})

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const ip = getClientIp(req)
  const rl = rateLimit(`rooms:rematch:${ip}`, { limit: 10, intervalMs: 60_000 })
  if (!rl.ok) return jsonError("Rate limited", 429, { retryAfterMs: rl.retryAfterMs })

  const parsed = await parseJson(req, rematchSchema)
  if (!parsed.ok) return jsonError("Invalid body", 400, { details: parsed.error })

  const roomId = ctx.params.id
  const supabase = getSupabaseAdmin()

  const { data: room } = await supabase
    .from("rooms")
    .select("host_participant_id")
    .eq("id", roomId)
    .single()
  if (!room) return jsonError("Room not found", 404)
  if (room.host_participant_id !== parsed.data.participantId) return jsonError("Host only", 403)

  await supabase.from("votes").delete().eq("room_id", roomId)
  await supabase.from("room_seeds").delete().eq("room_id", roomId)

  const { error: updateErr } = await supabase
    .from("rooms")
    .update({
      status: "LOBBY",
      seed_hash: null,
      seed_reveal: null,
      chaos_modifier: null,
      winner_option_id: null
    })
    .eq("id", roomId)
  if (updateErr) return jsonError("Failed to reset room", 500)

  const at = new Date().toISOString()
  await supabase.from("events").insert({
    room_id: roomId,
    type: "PHASE_SET",
    payload: { status: "LOBBY", at, reset: true }
  })

  return json({ ok: true })
}

