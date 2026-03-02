-- Migration: Add max_capacity to Events
-- This will allow admins to set venue limits for live tracking

alter table public.events 
add column if not exists max_capacity integer default 0;

-- Optional: Comment on column for clarity
comment on column public.events.max_capacity is 'Maximum number of students the venue can accommodate';
