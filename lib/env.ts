import { z } from "zod"

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional()
})

const serverSchema = clientSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
})

export function getClientEnv() {
  // In Next.js client bundles, `process.env` is not a complete runtime object.
  // Only direct `process.env.NEXT_PUBLIC_*` accesses are inlined at build time,
  // so we must read the specific keys rather than passing the whole env object.
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  })
  if (!parsed.success) {
    throw new Error(
      `Missing/invalid env: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`
    )
  }
  return parsed.data
}

export function getServerEnv() {
  const parsed = serverSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(
      `Missing/invalid env: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`
    )
  }
  return parsed.data
}
