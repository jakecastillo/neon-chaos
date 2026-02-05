# Event schema (append-only)

Events are inserted into `public.events` and streamed via Supabase Realtime.

All events:

```ts
type EventRow = {
  id: string
  room_id: string
  type:
    | "ROOM_CREATED"
    | "PARTICIPANT_JOINED"
    | "REACTION_SENT"
    | "OPTION_UPDATED"
    | "VOTE_PLACED"
    | "PHASE_SET"
    | "SEED_COMMIT"
    | "SEED_REVEAL"
    | "RESULT_FINAL"
  payload: Record<string, unknown>
  created_at: string
}
```

## Payloads

- `PHASE_SET`: `{ status: "LOBBY" | "LOCKED" | "REVEALING" | "RESULTS", at?: string, countdownSeconds?: number }`
- `REACTION_SENT`: `{ emoji: string, participantId?: string }`
- `SEED_COMMIT`: `{ seedHash: string }`
- `SEED_REVEAL`: `{ seed: string }`
- `RESULT_FINAL`: `{ winnerOptionId: string, modifier: string, seed: string }`

Notes:
- The server is source of truth: it sets `rooms.winner_option_id` and inserts `RESULT_FINAL`.
- Clients animate locally but always converge on the stored winner.
