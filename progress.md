Original prompt: Build a mobile-first Next.js web app called Neon Chaos (chaotic arcade casino decision game) with Supabase realtime and a PixiJS roulette mode, validated with a Playwright loop.

TODO
- Scaffold Next.js App Router + TS + Tailwind + shadcn/ui + Framer Motion + PixiJS.
- Add Supabase schema SQL + RLS notes.
- Implement API routes: create/join/vote/lock/reveal/rematch.
- Implement realtime event reducer + subscriptions.
- Build UI: Home, Create Room, Room Lobby, Reveal, Results + share card.
- Add `/dev/roulette` Pixi sandbox page with `window.advanceTime` + `window.render_game_to_text`.
- Add basic rate limiting + DB constraints (one vote per participant per room).

Notes
- Keep devicePixelRatio capped to 2 for canvas; pause rendering when tab hidden.
- Store participant id in localStorage per room for host/player identity (no auth MVP).

Update 2026-02-05
- Added Next.js + TS + Tailwind skeleton, basic neon UI primitives, quality context.
- Added Supabase migration `supabase/migrations/0001_init.sql` (+ private `room_seeds` table for commit-reveal).
- Implemented route handlers:
  - `POST /api/rooms`
  - `POST /api/rooms/:id/join`
  - `POST /api/rooms/:id/vote`
  - `POST /api/rooms/:id/lock`
  - `POST /api/rooms/:id/reveal`
  - `POST /api/rooms/:id/rematch`
- Added deterministic roulette outcome logic in `lib/roulette/outcome.ts`.
- Built room UI flow: Home, Create, Room lobby (join/vote/host controls), Results + share card.
- Added Pixi roulette scene `game/roulette/scene.ts` + `components/PixiRoulette` and dev page `/dev/roulette`.
- Playwright loop validated `/dev/roulette` with deterministic stepping via `window.advanceTime` and `window.render_game_to_text`.
