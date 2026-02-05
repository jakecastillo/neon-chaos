"use client"

import * as React from "react"
import { getSupabaseBrowser } from "@/lib/supabase/browser"
import type { EventRow, OptionRow, ParticipantRow, RoomRow, RoomStatus } from "@/lib/models"

export type RoomDerivedState = {
  room: RoomRow | null
  options: OptionRow[]
  participants: ParticipantRow[]
  votesByParticipantId: Record<string, string>
  reactions: { emoji: string; at: string; participantId?: string }[]
  lockCountdownEndsAtMs: number | null
  lastEventAt: string | null
  derivedStatus: RoomStatus
  loading: boolean
  error: string | null
}

type Action =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; payload: { room: RoomRow; options: OptionRow[]; participants: ParticipantRow[]; votesByParticipantId: Record<string, string> } }
  | { type: "SYNC_OK"; payload: { room: RoomRow; options: OptionRow[]; participants: ParticipantRow[]; votesByParticipantId: Record<string, string> } }
  | { type: "LOAD_ERR"; payload: { error: string } }
  | { type: "ROOM_UPDATE"; payload: { room: RoomRow } }
  | { type: "EVENT"; payload: { event: EventRow; participant?: ParticipantRow } }

function initialState(): RoomDerivedState {
  return {
    room: null,
    options: [],
    participants: [],
    votesByParticipantId: {},
    reactions: [],
    lockCountdownEndsAtMs: null,
    lastEventAt: null,
    derivedStatus: "LOBBY",
    loading: true,
    error: null
  }
}

function deriveStatus(room: RoomRow | null, votesByParticipantId: Record<string, string>) {
  if (!room) return "LOBBY" as const
  if (room.winner_option_id) return "RESULTS" as const
  if (room.status === "LOCKED") return "LOCKED" as const
  if (room.status === "REVEALING") return "REVEALING" as const
  if (Object.keys(votesByParticipantId).length > 0 && room.status === "LOBBY") return "LOBBY" as const
  return room.status
}

function reducer(state: RoomDerivedState, action: Action): RoomDerivedState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: null }
    case "LOAD_OK": {
      const next = {
        ...state,
        room: action.payload.room,
        options: action.payload.options,
        participants: action.payload.participants,
        votesByParticipantId: action.payload.votesByParticipantId,
        loading: false,
        error: null
      }
      return { ...next, derivedStatus: deriveStatus(next.room, next.votesByParticipantId) }
    }
    case "SYNC_OK": {
      const next = {
        ...state,
        room: action.payload.room,
        options: action.payload.options,
        participants: action.payload.participants,
        votesByParticipantId: action.payload.votesByParticipantId,
        loading: false,
        error: null
      }
      return { ...next, derivedStatus: deriveStatus(next.room, next.votesByParticipantId) }
    }
    case "LOAD_ERR":
      return { ...state, loading: false, error: action.payload.error }
    case "ROOM_UPDATE": {
      const nextRoom = action.payload.room
      const next = { ...state, room: nextRoom }
      return { ...next, derivedStatus: deriveStatus(next.room, next.votesByParticipantId) }
    }
    case "EVENT": {
      const e = action.payload.event
      const lastEventAt = e.created_at ?? state.lastEventAt

      if (e.type === "PARTICIPANT_JOINED" && action.payload.participant) {
        const exists = state.participants.some((p) => p.id === action.payload.participant!.id)
        const participants = exists
          ? state.participants
          : [...state.participants, action.payload.participant!]
        const next = { ...state, participants, lastEventAt }
        return { ...next, derivedStatus: deriveStatus(next.room, next.votesByParticipantId) }
      }

      if (e.type === "VOTE_PLACED") {
        const { participantId, optionId } = e.payload ?? {}
        if (typeof participantId === "string" && typeof optionId === "string") {
          const votesByParticipantId = {
            ...state.votesByParticipantId,
            [participantId]: optionId
          }
          const next = { ...state, votesByParticipantId, lastEventAt }
          return { ...next, derivedStatus: deriveStatus(next.room, next.votesByParticipantId) }
        }
      }

      if (e.type === "REACTION_SENT") {
        const emoji = typeof e.payload?.emoji === "string" ? e.payload.emoji : "✨"
        const participantId =
          typeof e.payload?.participantId === "string"
            ? e.payload.participantId
            : undefined
        const reactions = [...state.reactions, { emoji, at: e.created_at, participantId }].slice(-30)
        return { ...state, reactions, lastEventAt }
      }

      if (e.type === "PHASE_SET") {
        const status = e.payload?.status as RoomStatus | undefined
        const reset = Boolean(e.payload?.reset)
        let nextState: RoomDerivedState = { ...state, lastEventAt }
        if (reset) {
          nextState = {
            ...nextState,
            votesByParticipantId: {},
            reactions: [],
            lockCountdownEndsAtMs: null,
            room: nextState.room
              ? {
                  ...nextState.room,
                  winner_option_id: null,
                  chaos_modifier: null,
                  seed_reveal: null,
                  seed_hash: null,
                  status: "LOBBY"
                }
              : nextState.room
          }
        }
        if (status && nextState.room) {
          nextState = { ...nextState, room: { ...nextState.room, status } }
        }

        if (status === "LOCKED") {
          const at = typeof e.payload?.at === "string" ? Date.parse(e.payload.at) : NaN
          const countdownSeconds =
            typeof e.payload?.countdownSeconds === "number"
              ? e.payload.countdownSeconds
              : null
          if (Number.isFinite(at) && countdownSeconds !== null && countdownSeconds > 0) {
            nextState = {
              ...nextState,
              lockCountdownEndsAtMs: at + countdownSeconds * 1000
            }
          }
        } else if (status) {
          nextState = { ...nextState, lockCountdownEndsAtMs: null }
        }
        return { ...nextState, derivedStatus: deriveStatus(nextState.room, nextState.votesByParticipantId) }
      }

      if (e.type === "RESULT_FINAL" && state.room) {
        const winnerOptionId = e.payload?.winnerOptionId
        const modifier = e.payload?.modifier
        const seed = e.payload?.seed
        const room: RoomRow = {
          ...state.room,
          winner_option_id: typeof winnerOptionId === "string" ? winnerOptionId : state.room.winner_option_id,
          chaos_modifier: typeof modifier === "string" ? modifier : state.room.chaos_modifier,
          seed_reveal: typeof seed === "string" ? seed : state.room.seed_reveal,
          status: "RESULTS"
        }
        return { ...state, room, lastEventAt, derivedStatus: "RESULTS" }
      }

      return { ...state, lastEventAt }
    }
  }
}

async function fetchSnapshot(roomId: string) {
  const supabase = getSupabaseBrowser()

  const [{ data: room }, { data: options }, { data: participants }, { data: votes }] =
    await Promise.all([
      supabase.from("rooms").select("*").eq("id", roomId).single(),
      supabase.from("options").select("*").eq("room_id", roomId).order("order_index", { ascending: true }),
      supabase.from("participants").select("*").eq("room_id", roomId).order("created_at", { ascending: true }),
      supabase.from("votes").select("*").eq("room_id", roomId)
    ])

  if (!room) throw new Error("Room not found")

  const votesByParticipantId: Record<string, string> = {}
  for (const v of votes ?? []) votesByParticipantId[v.participant_id] = v.option_id

  return {
    room: room as RoomRow,
    options: (options ?? []) as OptionRow[],
    participants: (participants ?? []) as ParticipantRow[],
    votesByParticipantId
  }
}

export function useRoomState(roomId: string) {
  const [state, dispatch] = React.useReducer(reducer, undefined, initialState)

  const loadSnapshot = React.useCallback(
    async (opts: { setLoading: boolean }) => {
      if (opts.setLoading) dispatch({ type: "LOAD_START" })
      try {
        const snap = await fetchSnapshot(roomId)
        dispatch({ type: opts.setLoading ? "LOAD_OK" : "SYNC_OK", payload: snap })
      } catch (e: any) {
        const message = e?.message ?? "Failed to load"
        if (opts.setLoading) dispatch({ type: "LOAD_ERR", payload: { error: message } })
      }
    },
    [roomId]
  )

  React.useEffect(() => {
    let canceled = false
    void (async () => {
      if (canceled) return
      await loadSnapshot({ setLoading: true })
    })()
    return () => {
      canceled = true
    }
  }, [loadSnapshot])

  React.useEffect(() => {
    const supabase = getSupabaseBrowser()
    let canceled = false

    const unsub = supabase
      .channel(`room:${roomId}:events`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          if (canceled) return
          const e = payload.new as EventRow
          if (e.type === "PARTICIPANT_JOINED" && typeof e.payload?.id === "string") {
            const { data: p } = await supabase.from("participants").select("*").eq("id", e.payload.id).single()
            dispatch({ type: "EVENT", payload: { event: e, participant: (p as any) ?? undefined } })
            return
          }
          dispatch({ type: "EVENT", payload: { event: e } })
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (canceled) return
          dispatch({ type: "ROOM_UPDATE", payload: { room: payload.new as RoomRow } })
        }
      )
      .subscribe()

    return () => {
      canceled = true
      supabase.removeChannel(unsub)
    }
  }, [roomId])

  const refresh = React.useCallback(() => {
    void loadSnapshot({ setLoading: false })
  }, [loadSnapshot])

  React.useEffect(() => {
    if (!state.room) return
    if (state.error) return
    const t = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      void loadSnapshot({ setLoading: false })
    }, 5000)
    return () => window.clearInterval(t)
  }, [loadSnapshot, state.error, state.room])

  return { ...state, refresh }
}
