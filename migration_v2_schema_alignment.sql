-- Migration: Schema Alignment (v2)
-- Aligning database with app logic: Adding clubs table and missing fields to profiles/events

-- 1. Create Clubs Table
create table if not exists public.clubs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now() not null,
  name text not null,
  head_name text,
  contact_details text,
  logo_url text,
  college_id uuid references public.colleges(id) on delete cascade not null
);

-- 2. Add missing fields to Profiles (Student specific details)
alter table public.profiles 
add column if not exists email text,
add column if not exists course text,
add column if not exists year text,
add column if not exists degree text,
add column if not exists batch text,
add column if not exists requires_password_change boolean default false;

-- 3. Add missing fields to Events (For richer UI)
alter table public.events 
add column if not exists images text[] default '{}',
add column if not exists brochure_url text,
add column if not exists club_id uuid references public.clubs(id) on delete set null;

-- 4. Update handle_new_user function to sync metadata to profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    full_name, 
    role, 
    email, 
    college_id,
    course,
    year,
    degree,
    batch
  )
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'student'), 
    new.email,
    (new.raw_user_meta_data->>'college_id')::uuid,
    new.raw_user_meta_data->>'course',
    new.raw_user_meta_data->>'year',
    new.raw_user_meta_data->>'degree',
    new.raw_user_meta_data->>'batch'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 5. Enable RLS and Policies for Clubs
alter table public.clubs enable row level security;

drop policy if exists "Clubs are viewable by everyone" on public.clubs;
create policy "Clubs are viewable by everyone" 
on public.clubs for select 
using (true);

drop policy if exists "College admins can manage clubs" on public.clubs;
create policy "College admins can manage clubs" 
on public.clubs for all 
using (
  exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'college_admin' 
    and college_id = clubs.college_id
  )
);
