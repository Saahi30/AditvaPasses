-- Migration: Allow public read of colleges
-- Needed for the signup dropdown to work

drop policy if exists "Colleges are viewable by everyone" on public.colleges;

create policy "Colleges are viewable by everyone" 
on public.colleges for select 
using (true);
