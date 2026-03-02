-- Create a table for Public Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default now(),
  full_name text,
  avatar_url text,
  role text default 'attendee' check (role in ('attendee', 'organizer', 'admin'))
);

-- Create a table for Events
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
  cover_image_url text,
  max_capacity integer,
  is_published boolean default false
);

-- Create a table for Passes (Tickets)
create table if not exists passes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  status text default 'valid' check (status in ('valid', 'used', 'cancelled')),
  qr_code uuid default gen_random_uuid() unique not null,
  payment_status text default 'pending' check (payment_status in ('pending', 'completed', 'failed')),
  payment_intent_id text
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table events enable row level security;
alter table passes enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Events Policies
create policy "Published events are viewable by everyone." on events
  for select using (is_published = true or auth.uid() = organizer_id);

create policy "Organizers can insert events." on events
  for insert with check (auth.uid() = organizer_id);

create policy "Organizers can update own events." on events
  for update using (auth.uid() = organizer_id);

-- Passes Policies
create policy "Users can view their own passes." on passes
  for select using (auth.uid() = user_id or auth.uid() in (
    select organizer_id from events where id = passes.event_id
  ));

create policy "Users can insert their own passes." on passes
  for insert with check (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger correctly create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_events_updated_at on events;
create trigger update_events_updated_at before update on events for each row execute procedure update_updated_at_column();

drop trigger if exists update_profiles_updated_at on profiles;
create trigger update_profiles_updated_at before update on profiles for each row execute procedure update_updated_at_column();
