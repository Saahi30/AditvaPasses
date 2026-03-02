-- Migration: Add Clubs and enhance Events for College Admins

-- 1. Create Clubs table
create table if not exists clubs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  logo_url text default 'https://wrnfdvitdtvivyokhmqm.supabase.co/storage/v1/object/public/assets/default-club.png',
  head_name text not null,
  contact_details text,
  college_id uuid references colleges(id) on delete cascade not null
);

-- 2. Update Events table with Club reference and extra fields
alter table events add column if not exists club_id uuid references clubs(id) on delete set null;
alter table events add column if not exists images text[] default '{}';
alter table events add column if not exists brochure_url text;

-- 3. Enable RLS on Clubs
alter table clubs enable row level security;

-- 4. Clubs RLS Policies
create policy "Clubs are viewable by everyone in the college" on clubs
  for select using (true);

create policy "College admins can manage clubs for their college" on clubs
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'college_admin' and college_id = clubs.college_id
    )
  );

-- 5. Update Events RLS for club access (redundant but good for safety)
create policy "College admins can manage events for their clubs" on events
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'college_admin' and college_id = events.college_id
    )
  );
