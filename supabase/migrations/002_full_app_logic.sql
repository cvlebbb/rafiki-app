-- Rafiki full schema + RLS
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.hangouts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  date date not null,
  time time not null,
  budget integer not null,
  people_needed integer not null,
  meetup_style text check (meetup_style in ('common_point', 'direct')) not null,
  location_name text,
  latitude float,
  longitude float,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  closes_at timestamptz generated always as ((date + time)::timestamptz - interval '1 hour') stored
);

create table if not exists public.hangout_members (
  id uuid primary key default gen_random_uuid(),
  hangout_id uuid references public.hangouts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(hangout_id, user_id)
);

create table if not exists public.group_chats (
  id uuid primary key default gen_random_uuid(),
  hangout_id uuid unique references public.hangouts(id) on delete cascade,
  name text not null,
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.group_chats(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  is_system boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade,
  addressee_id uuid references public.profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

create index if not exists idx_hangouts_active on public.hangouts(is_active, closes_at);
create index if not exists idx_hangout_members_user on public.hangout_members(user_id);
create index if not exists idx_messages_chat_created on public.messages(chat_id, created_at);
create index if not exists idx_friendships_users on public.friendships(requester_id, addressee_id);

alter table public.profiles enable row level security;
alter table public.hangouts enable row level security;
alter table public.hangout_members enable row level security;
alter table public.group_chats enable row level security;
alter table public.messages enable row level security;
alter table public.friendships enable row level security;

-- profiles policies
create policy if not exists "profiles read all"
on public.profiles for select using (true);

create policy if not exists "profiles insert own"
on public.profiles for insert with check (auth.uid() = id);

create policy if not exists "profiles update own"
on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- hangouts policies
create policy if not exists "hangouts read active"
on public.hangouts for select using (is_active = true or auth.uid() = created_by);

create policy if not exists "hangouts create own"
on public.hangouts for insert to authenticated with check (auth.uid() = created_by);

create policy if not exists "hangouts update owner"
on public.hangouts for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy if not exists "hangouts delete owner"
on public.hangouts for delete using (auth.uid() = created_by);

-- hangout_members policies
create policy if not exists "members read own_or_creator"
on public.hangout_members for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.hangouts h
    where h.id = hangout_members.hangout_id and h.created_by = auth.uid()
  )
);

create policy if not exists "members insert self"
on public.hangout_members for insert to authenticated with check (auth.uid() = user_id);

-- group_chats policies
create policy if not exists "group chats read if member"
on public.group_chats for select using (
  exists (
    select 1 from public.hangout_members hm
    where hm.hangout_id = group_chats.hangout_id and hm.user_id = auth.uid()
  )
);

create policy if not exists "group chats insert if creator"
on public.group_chats for insert to authenticated with check (
  exists (
    select 1 from public.hangouts h
    where h.id = group_chats.hangout_id and h.created_by = auth.uid()
  )
);

-- messages policies
create policy if not exists "messages read if member"
on public.messages for select using (
  exists (
    select 1
    from public.group_chats gc
    join public.hangout_members hm on hm.hangout_id = gc.hangout_id
    where gc.id = messages.chat_id and hm.user_id = auth.uid()
  )
);

create policy if not exists "messages insert if member"
on public.messages for insert to authenticated with check (
  exists (
    select 1
    from public.group_chats gc
    join public.hangout_members hm on hm.hangout_id = gc.hangout_id
    where gc.id = messages.chat_id and hm.user_id = auth.uid()
  )
);

-- friendships policies
create policy if not exists "friendships read involved"
on public.friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy if not exists "friendships insert requester"
on public.friendships for insert to authenticated with check (auth.uid() = requester_id);

create policy if not exists "friendships update involved"
on public.friendships for update using (auth.uid() = requester_id or auth.uid() = addressee_id)
with check (auth.uid() = requester_id or auth.uid() = addressee_id);

-- auth trigger: create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter publication supabase_realtime add table public.hangouts;
alter publication supabase_realtime add table public.group_chats;
alter publication supabase_realtime add table public.messages;
