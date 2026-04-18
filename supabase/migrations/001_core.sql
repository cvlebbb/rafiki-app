-- Rafiki core schema + RLS
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 2 and 32),
  avatar_url text,
  friends uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now()
);

create table if not exists public.hangouts (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 2000),
  location_name text not null,
  lat double precision not null,
  lng double precision not null,
  event_date timestamptz not null,
  budget numeric(10,2) not null default 0,
  max_slots integer not null check (max_slots >= 2),
  meetup_type text not null check (meetup_type in ('venue', 'pre-meet')),
  status text not null default 'open' check (status in ('open', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  hangout_id uuid not null references public.hangouts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (hangout_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  hangout_id uuid not null references public.hangouts(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  media_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_hangouts_event_date on public.hangouts(event_date);
create index if not exists idx_participants_hangout on public.participants(hangout_id);
create index if not exists idx_messages_hangout_created on public.messages(hangout_id, created_at);

alter table public.profiles enable row level security;
alter table public.hangouts enable row level security;
alter table public.participants enable row level security;
alter table public.messages enable row level security;

-- profiles policies
create policy "profiles readable by everyone"
on public.profiles
for select
using (true);

create policy "users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- hangouts policies
create policy "hangouts readable by everyone"
on public.hangouts
for select
using (true);

create policy "authenticated users can create hangouts"
on public.hangouts
for insert
to authenticated
with check (auth.uid() = organizer_id);

create policy "organizer can update hangout"
on public.hangouts
for update
using (auth.uid() = organizer_id)
with check (auth.uid() = organizer_id);

-- participants policies
create policy "participants readable by everyone"
on public.participants
for select
using (true);

create policy "users can join as themselves"
on public.participants
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can leave themselves"
on public.participants
for delete
using (auth.uid() = user_id);

-- messages policies
create policy "messages viewable if participant"
on public.messages
for select
using (
  exists (
    select 1
    from public.participants p
    where p.hangout_id = messages.hangout_id
      and p.user_id = auth.uid()
  )
);

create policy "participants can send messages"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.participants p
    where p.hangout_id = messages.hangout_id
      and p.user_id = auth.uid()
  )
);

alter publication supabase_realtime add table public.messages;
