-- ==============================================================================
-- TriageSync 2.0: Supabase Auth & Role-Based Profiles Trigger Migration
-- Run this in your Supabase Project -> SQL Editor -> Run
-- ==============================================================================

-- 1. Create user_role ENUM type if not exists
do $$ begin
  create type user_role as enum ('citizen', 'hospital_staff', 'paramedic', 'dispatcher', 'admin');
exception
  when duplicate_object then null;
end $$;

-- 2. Create public.profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role user_role not null default 'citizen',
  hospital_id text, -- Can be linked to public.hospitals(id)
  hospital_name text,
  badge_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policies for public.profiles
drop policy if exists "Public profiles are readable by everyone" on public.profiles;
create policy "Public profiles are readable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 4. Automatic Trigger Function: Trigger on auth.users when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_role text;
  parsed_role public.user_role;
begin
  raw_role := coalesce(new.raw_user_meta_data->>'role', 'citizen');
  
  -- Safely parse role or fallback to citizen
  if raw_role in ('citizen', 'hospital_staff', 'paramedic', 'dispatcher', 'admin') then
    parsed_role := raw_role::public.user_role;
  else
    parsed_role := 'citizen'::public.user_role;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    hospital_id,
    hospital_name,
    badge_number
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    parsed_role,
    new.raw_user_meta_data->>'hospital_id',
    new.raw_user_meta_data->>'hospital_name',
    new.raw_user_meta_data->>'badge_number'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = coalesce(excluded.role, public.profiles.role),
    hospital_id = coalesce(excluded.hospital_id, public.profiles.hospital_id),
    hospital_name = coalesce(excluded.hospital_name, public.profiles.hospital_name),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- 5. Attach Trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable realtime on profiles table
alter publication supabase_realtime add table public.profiles;
