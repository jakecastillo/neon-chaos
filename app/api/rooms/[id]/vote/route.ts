import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getClientIp, rateLimit } from "@/lib/rateLimit"
import { json, jsonError, parseJson } from "@/lib/api"

export const runtime = "nodejs"

const voteSchema = z.object({
  participantId: z.string().uuid(),
  optionId: z.string().uuid()
})

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const ip = getClientIp(req)
  const rl = rateLimit(`rooms:vote:${ip}`, { limit: 40, intervalMs: 60_000 })
  if (!rl.ok) return jsonError("Rate limited", 429, { retryAfterMs: rl.retryAfterMs })

  const parsed = await parseJson(req, voteSchema)
  if (!parsed.ok) return jsonError("Invalid body", 400, { details: parsed.error })

  const roomId = ctx.params.id
  const { participantId, optionId } = parsed.data
  const supabase = getSupabaseAdmin()

  const { data: room } = await supabase
    .from("rooms")
    .select("status")
    .eq("id", roomId)
    .single()
  if (!room) return jsonError("Room not found", 404)
  if (room.status !== "LOBBY") return jsonError("Voting is closed", 409)

  const { data: participant } = await supabase
    .from("participants")
    .select("id, room_id")
    .eq("id", participantId)
    .single()
  if (!participant || participant.room_id !== roomId) return jsonError("Invalid participant", 403)

  const { data: option } = await supabase
    .from("options")
    .select("id, room_id")
    .eq("id", optionId)
    .single()
  if (!option || option.room_id !== roomId) return jsonError("Invalid option", 400)

  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("room_id", roomId)
    .eq("participant_id", participantId)
    .maybeSingle()

  if (existing?.id) {
    const { error: upErr } = await supabase
      .from("votes")
      .update({ option_id: optionId })
      .eq("id", existing.id)
    if (upErr) return jsonError("Failed to update vote", 500)
  } else {
    const { error: insErr } = await supabase.from("votes").insert({
      room_id: roomId,
      participant_id: participantId,
      option_id: optionId
    })
    if (insErr) return jsonError("Failed to place vote", 500)
  }

  await supabase.from("events").insert({
    room_id: roomId,
    type: "VOTE_PLACED",
    payload: { participantId, optionId }
  })

  return json({ ok: true })
}

