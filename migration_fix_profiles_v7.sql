-- Migration: Fix handle_new_user to include student fields
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
