-- Migration: Sync Email to Profiles

alter table profiles add column if not exists email text;

update profiles
set email = users.email
from auth.users as users
where profiles.id = users.id;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', coalesce(new.raw_user_meta_data->>'role', 'student'), new.email);
  return new;
end;
$$ language plpgsql security definer;
