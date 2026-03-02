-- Create a table for Colleges
create table if not exists colleges (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null unique,
  courses text[] default '{}', -- e.g., ['B.Tech', 'BCA', 'B.Com']
  years text[] default '{"1st", "2nd", "3rd", "4th"}' -- e.g., ['1st', '2nd']
);

-- Update profiles table to include college_id and role enhancements
alter table profiles add column if not exists college_id uuid references colleges(id) on delete set null;
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('student', 'college_admin', 'super_admin'));

-- Update events table to include targeting
alter table events add column if not exists college_id uuid references colleges(id) on delete cascade;
alter table events add column if not exists target_courses text[] default '{}';
alter table events add column if not exists target_years text[] default '{}';

-- Migration cleanup for passes
alter table passes add column if not exists scanned_at timestamp with time zone;
alter table passes add column if not exists scanned_by uuid references profiles(id);

-- Enable RLS on colleges
alter table colleges enable row level security;

-- Colleges Policies
create policy "Colleges are viewable by everyone" on colleges
  for select using (true);

create policy "Only super admin can manage colleges" on colleges
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'super_admin'
    )
  );

-- Update Events RLS for College Admins
drop policy if exists "Organizers can insert events." on events;
create policy "College admins can insert events for their college." on events
  for insert with check (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'college_admin' and college_id = events.college_id
    )
  );

drop policy if exists "Organizers can update own events." on events;
create policy "College admins can update their college events." on events
  for update using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'college_admin' and college_id = events.college_id
    )
  );

-- Ensure user signup still works but defaults to student
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'student');
  return new;
end;
$$ language plpgsql security definer;
