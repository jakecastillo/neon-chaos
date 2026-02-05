import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getClientEnv } from "@/lib/env"

let client: SupabaseClient | null = null

export function getSupabaseBrowser() {
  if (client) return client
  const env = getClientEnv()
  client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 15 } }
  })
  return client
}

