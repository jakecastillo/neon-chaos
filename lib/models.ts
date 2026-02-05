export type RoomStatus = "LOBBY" | "LOCKED" | "REVEALING" | "RESULTS"
export type RoomMode = "ROULETTE_VOTE"

export type RoomRow = {
  id: string
  name: string
  mode: RoomMode | string
  status: RoomStatus
  host_participant_id: string | null
  seed_hash: string | null
  seed_reveal: string | null
  chaos_modifier: string | null
  winner_option_id: string | null
  created_at: string
}

export type OptionRow = {
  id: string
  room_id: string
  label: string
  order_index: number
  created_at: string
}

export type ParticipantRole = "HOST" | "PLAYER" | "SPECTATOR"
export type ParticipantRow = {
  id: string
  room_id: string
  nickname: string
  role: ParticipantRole
  created_at: string
  last_seen_at: string
}

export type VoteRow = {
  id: string
  room_id: string
  participant_id: string
  option_id: string
  created_at: string
}

export type EventType =
  | "ROOM_CREATED"
  | "PARTICIPANT_JOINED"
  | "REACTION_SENT"
  | "OPTION_UPDATED"
  | "VOTE_PLACED"
  | "PHASE_SET"
  | "SEED_COMMIT"
  | "SEED_REVEAL"
  | "RESULT_FINAL"

export type EventRow = {
  id: string
  room_id: string
  type: EventType
  payload: any
  created_at: string
}

export type ChaosModifier =
  | "DoubleDown"
  | "Lucky7"
  | "SabotageLowSteals"
  | "HotStreakNerf"

