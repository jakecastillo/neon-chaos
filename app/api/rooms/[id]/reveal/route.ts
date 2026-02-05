import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getClientIp, rateLimit } from "@/lib/rateLimit"
import { json, jsonError, parseJson } from "@/lib/api"
import { computeRouletteOutcome } from "@/lib/roulette/outcome"
import { sha256Hex } from "@/lib/crypto"

export const runtime = "nodejs"

const revealSchema = z.object({
  participantId: z.string().uuid()
})

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const ip = getClientIp(req)
  const rl = rateLimit(`rooms:reveal:${ip}`, { limit: 12, intervalMs: 60_000 })
  if (!rl.ok) return jsonError("Rate limited", 429, { retryAfterMs: rl.retryAfterMs })

  const parsed = await parseJson(req, revealSchema)
  if (!parsed.ok) return jsonError("Invalid body", 400, { details: parsed.error })

  const roomId = ctx.params.id
  const supabase = getSupabaseAdmin()

  const { data: room } = await supabase
    .from("rooms")
    .select("id,status,host_participant_id,seed_hash,winner_option_id,chaos_modifier,seed_reveal")
    .eq("id", roomId)
    .single()
  if (!room) return jsonError("Room not found", 404)
  if (room.host_participant_id !== parsed.data.participantId) return jsonError("Host only", 403)
  if (room.status !== "LOCKED" && room.status !== "RESULTS") return jsonError("Room not locked", 409)

  if (room.winner_option_id && room.seed_reveal && room.chaos_modifier) {
    return json({
      ok: true,
      winnerOptionId: room.winner_option_id,
      modifier: room.chaos_modifier,
      seed: room.seed_reveal
    })
  }

  const { data: seedRow } = await supabase
    .from("room_seeds")
    .select("seed,seed_hash")
    .eq("room_id", roomId)
    .single()
  if (!seedRow) return jsonError("Missing seed commit", 409)
  if (room.seed_hash && seedRow.seed_hash !== room.seed_hash) return jsonError("Seed hash mismatch", 409)
  if (sha256Hex(seedRow.seed) !== seedRow.seed_hash) return jsonError("Seed commit invalid", 409)

  const { data: options } = await supabase
    .from("options")
    .select("id,order_index")
    .eq("room_id", roomId)
    .order("order_index", { ascending: true })
  if (!options || options.length < 2) return jsonError("Not enough options", 409)

  const { data: votes } = await supabase
    .from("votes")
    .select("option_id")
    .eq("room_id", roomId)

  const voteCounts: Record<string, number> = {}
  for (const v of votes ?? []) voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1

  const optionIds = options.map((o) => o.id)
  const outcome = computeRouletteOutcome({
    seed: seedRow.seed,
    optionIds,
    voteCountsByOptionId: voteCounts
  })

  const { error: updateErr } = await supabase
    .from("rooms")
    .update({
      status: "RESULTS",
      seed_reveal: seedRow.seed,
      chaos_modifier: outcome.modifier,
      winner_option_id: outcome.winnerOptionId
    })
    .eq("id", roomId)
  if (updateErr) return jsonError("Failed to persist result", 500)

  await supabase
    .from("room_seeds")
    .update({ revealed_at: new Date().toISOString() })
    .eq("room_id", roomId)

  const at = new Date().toISOString()
  await supabase.from("events").insert([
    { room_id: roomId, type: "PHASE_SET", payload: { status: "REVEALING", at } },
    { room_id: roomId, type: "SEED_REVEAL", payload: { seed: seedRow.seed } },
    { room_id: roomId, type: "RESULT_FINAL", payload: { winnerOptionId: outcome.winnerOptionId, modifier: outcome.modifier, seed: seedRow.seed } },
    { room_id: roomId, type: "PHASE_SET", payload: { status: "RESULTS", at } }
  ])

  return json({
    ok: true,
    winnerOptionId: outcome.winnerOptionId,
    modifier: outcome.modifier,
    seed: seedRow.seed,
    weights: outcome.weights
  })
}

