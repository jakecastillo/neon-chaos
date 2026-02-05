import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getClientIp, rateLimit } from "@/lib/rateLimit"
import { json, jsonError, parseJson } from "@/lib/api"
import { randomSeed, sha256Hex } from "@/lib/crypto"

export const runtime = "nodejs"

const lockSchema = z.object({
  participantId: z.string().uuid(),
  countdownSeconds: z.number().int().min(0).max(20).optional()
})

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const ip = getClientIp(req)
  const rl = rateLimit(`rooms:lock:${ip}`, { limit: 12, intervalMs: 60_000 })
  if (!rl.ok) return jsonError("Rate limited", 429, { retryAfterMs: rl.retryAfterMs })

  const parsed = await parseJson(req, lockSchema)
  if (!parsed.ok) return jsonError("Invalid body", 400, { details: parsed.error })

  const roomId = ctx.params.id
  const supabase = getSupabaseAdmin()

  const { data: room } = await supabase
    .from("rooms")
    .select("id,status,host_participant_id")
    .eq("id", roomId)
    .single()
  if (!room) return jsonError("Room not found", 404)
  if (room.host_participant_id !== parsed.data.participantId) return jsonError("Host only", 403)
  if (room.status !== "LOBBY") return jsonError("Already locked", 409)

  const seed = randomSeed()
  const seedHash = sha256Hex(seed)

  const { error: seedErr } = await supabase
    .from("room_seeds")
    .upsert({ room_id: roomId, seed, seed_hash: seedHash })
  if (seedErr) return jsonError("Failed to commit seed", 500)

  const { error: updateErr } = await supabase
    .from("rooms")
    .update({ status: "LOCKED", seed_hash: seedHash, seed_reveal: null, winner_option_id: null, chaos_modifier: null })
    .eq("id", roomId)
  if (updateErr) return jsonError("Failed to lock room", 500)

  const countdownSeconds = parsed.data.countdownSeconds ?? 5
  const at = new Date().toISOString()
  await supabase.from("events").insert([
    { room_id: roomId, type: "PHASE_SET", payload: { status: "LOCKED", at, countdownSeconds } },
    { room_id: roomId, type: "SEED_COMMIT", payload: { seedHash } }
  ])

  return json({ ok: true, seedHash, countdownSeconds })
}

