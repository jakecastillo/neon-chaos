import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js"
import type { EventRow, RoomRow } from "@/lib/models"

export function subscribeRoomEvents(args: {
  supabase: SupabaseClient
  roomId: string
  onEvent: (event: EventRow) => void
  onRoomUpdate: (room: RoomRow) => void
}) {
  const { supabase, roomId, onEvent, onRoomUpdate } = args

  const channel: RealtimeChannel = supabase
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "events",
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        onEvent(payload.new as EventRow)
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`
      },
      (payload) => {
        onRoomUpdate(payload.new as RoomRow)
      }
    )

  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

