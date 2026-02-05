# Supabase setup

## Migrations

Run the SQL in `supabase/migrations/0001_init.sql` in your Supabase project.

## Env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client + realtime)
- `SUPABASE_SERVICE_ROLE_KEY` (server route handlers; never expose to client)

## RLS hardening (post-MVP)

The MVP policies are intentionally permissive (guests can insert participants/votes/events).
To harden later:

- Require auth and use `auth.uid()` in insert policies.
- Add ownership checks (only host can lock/reveal/rematch).
- Add per-room join codes / signed join tokens.
- Add stricter constraints/rate limits (e.g., max participants per room, max events per minute).

