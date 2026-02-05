import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getClientIp, rateLimit } from "@/lib/rateLimit"
import { json, jsonError, parseJson } from "@/lib/api"

export const runtime = "nodejs"

const reactSchema = z.object({
  emoji: z.string().min(1).max(8),
  participantId: z.string().uuid().optional()
})

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const ip = getClientIp(req)
  const rl = rateLimit(`rooms:react:${ip}`, { limit: 45, intervalMs: 60_000 })
  if (!rl.ok) return jsonError("Rate limited", 429, { retryAfterMs: rl.retryAfterMs })

  const parsed = await parseJson(req, reactSchema)
  if (!parsed.ok) return jsonError("Invalid body", 400, { details: parsed.error })

  const roomId = ctx.params.id
  const supabase = getSupabaseAdmin()

  const { data: room } = await supabase.from("rooms").select("id").eq("id", roomId).single()
  if (!room) return jsonError("Room not found", 404)

  await supabase.from("events").insert({
    room_id: roomId,
    type: "REACTION_SENT",
    payload: { emoji: parsed.data.emoji, participantId: parsed.data.participantId }
  })

  return json({ ok: true })
}

