-- ADITVA PASSES UNIFIED MIGRATION (RUN THIS FIRST)

-- 1. Create a table for Colleges
create table if not exists colleges (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null unique,
  courses text[] default '{}',
  years text[] default '{"1st", "2nd", "3rd", "4th"}'
);

-- 2. Create a table for Public Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default now(),
  full_name text,
  avatar_url text,
  role text default 'student' check (role in ('student', 'college_admin', 'super_admin')),
  college_id uuid references colleges(id) on delete set null
);

-- 3. Create a table for Events
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  location text not null,
  event_date timestamp with time zone not null,
  price numeric default 0,
  organizer_id uuid references profiles(id) on delete cascade not null,
  college_id uuid references colleges(id) on delete cascade,
  cover_image_url text,
  max_capacity integer,
  is_published boolean default false,
  target_courses text[] default '{}',
  target_years text[] default '{}'
);

-- 4. Create a table for Passes (Tickets)
create table if not exists passes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  status text default 'valid' check (status in ('valid', 'used', 'cancelled')),
  qr_code uuid default gen_random_uuid() unique not null,
  payment_status text default 'completed' check (payment_status in ('pending', 'completed', 'failed')),
  scanned_at timestamp with time zone,
  scanned_by uuid references profiles(id)
);

-- 5. Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table colleges enable row level security;
alter table events enable row level security;
alter table passes enable row level security;

-- 6. RLS Policies

-- Profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Colleges
create policy "Colleges are viewable by everyone" on colleges for select using (true);
create policy "Only super admin can manage colleges" on colleges for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
);

-- Events
create policy "Published events are viewable by everyone." on events
  for select using (is_published = true or auth.uid() = organizer_id);

create policy "College admins can manage events for their college." on events
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'college_admin' and college_id = events.college_id)
  );

-- Passes
create policy "Users can view their own passes." on passes
  for select using (auth.uid() = user_id or exists (
    select 1 from events where id = passes.event_id and events.organizer_id = auth.uid()
  ));

create policy "Admins can issue passes." on passes
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'college_admin')
  );

-- 7. Functions & Triggers

-- Handle User Creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'student');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Handle Timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_events_updated_at before update on events for each row execute procedure update_updated_at_column();
create trigger update_profiles_updated_at before update on profiles for each row execute procedure update_updated_at_column();
