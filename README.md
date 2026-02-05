# Neon Chaos

Chaotic arcade decision-making for groups (Next.js + Supabase + PixiJS).

## Local dev

1) Install deps:

```bash
npm install
```

2) Configure env:

```bash
cp env.example .env.local
```

Fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

3) Run:

```bash
npm run dev
```

Open `http://127.0.0.1:3000`.

## Supabase

- Run `supabase/migrations/0001_init.sql` in your Supabase SQL editor.
- Enable Realtime for `public.events` and `public.rooms` (Database → Replication → toggle tables).

Notes:
- MVP RLS is permissive for guest play; see `docs/supabase-setup.md` for hardening.

## MVP flow

- Home → Create room → share link → friends spectate/join → vote → host Lock In → host SPIN → results → share card → rematch.

## Dev / Playwright

- Pixi sandbox page: `http://127.0.0.1:3000/dev/roulette`
- Exposes `window.advanceTime(ms)` and `window.render_game_to_text()` for the Playwright loop.

