-- Neon Chaos MVP schema (Supabase Postgres)

create extension if not exists pgcrypto;

-- Enums via CHECK constraints to keep migrations simple.

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mode text not null default 'ROULETTE_VOTE',
  status text not null default 'LOBBY',
  host_participant_id uuid,
  seed_hash text,
  seed_reveal text,
  chaos_modifier text,
  winner_option_id uuid,
  created_at timestamptz not null default now(),
  constraint rooms_status_check check (status in ('LOBBY','LOCKED','REVEALING','RESULTS'))
);

create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  label text not null,
  order_index int not null,
  created_at timestamptz not null default now(),
  constraint options_label_len check (char_length(label) between 1 and 48)
);
create index if not exists options_room_id_idx on public.options(room_id);
create unique index if not exists options_room_order_idx on public.options(room_id, order_index);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  nickname text not null,
  role text not null default 'SPECTATOR',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint participants_role_check check (role in ('HOST','PLAYER','SPECTATOR')),
  constraint participants_nickname_len check (char_length(nickname) between 1 and 24)
);
create index if not exists participants_room_id_idx on public.participants(room_id);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  option_id uuid not null references public.options(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists votes_room_id_idx on public.votes(room_id);
create unique index if not exists votes_room_participant_unique on public.votes(room_id, participant_id);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint events_type_check check (
    type in (
      'ROOM_CREATED',
      'PARTICIPANT_JOINED',
      'REACTION_SENT',
      'OPTION_UPDATED',
      'VOTE_PLACED',
      'PHASE_SET',
      'SEED_COMMIT',
      'SEED_REVEAL',
      'RESULT_FINAL'
    )
  )
);
create index if not exists events_room_created_at_idx on public.events(room_id, created_at);

-- Private seed storage for commit-reveal (not readable by anon/authenticated).
create table if not exists public.room_seeds (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  seed text not null,
  seed_hash text not null,
  created_at timestamptz not null default now(),
  revealed_at timestamptz
);

-- RLS
alter table public.rooms enable row level security;
alter table public.options enable row level security;
alter table public.participants enable row level security;
alter table public.votes enable row level security;
alter table public.events enable row level security;
alter table public.room_seeds enable row level security;

-- Read access (MVP)
drop policy if exists rooms_select on public.rooms;
create policy rooms_select on public.rooms
  for select to anon, authenticated
  using (true);

drop policy if exists options_select on public.options;
create policy options_select on public.options
  for select to anon, authenticated
  using (true);

drop policy if exists participants_select on public.participants;
create policy participants_select on public.participants
  for select to anon, authenticated
  using (true);

drop policy if exists votes_select on public.votes;
create policy votes_select on public.votes
  for select to anon, authenticated
  using (true);

drop policy if exists events_select on public.events;
create policy events_select on public.events
  for select to anon, authenticated
  using (true);

-- Guest inserts (MVP). Harden later by requiring auth and validating ownership.
drop policy if exists participants_insert on public.participants;
create policy participants_insert on public.participants
  for insert to anon, authenticated
  with check (true);

drop policy if exists votes_insert on public.votes;
create policy votes_insert on public.votes
  for insert to anon, authenticated
  with check (true);

drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  for insert to anon, authenticated
  with check (true);

-- No public updates/deletes (server uses service_role key).
