-- Migration: Add email_domain and batches to colleges, and update RLS
alter table public.colleges 
add column if not exists email_domain text,
add column if not exists batches text[] default '{}';

-- Update RLS for colleges to allow college_admins to update their own college data
drop policy if exists "Only super admin can manage colleges" on colleges;

create policy "Super admins can do everything on colleges" 
on colleges for all 
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
);

create policy "College admins can update their own college settings" 
on colleges for update 
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'college_admin' and college_id = colleges.id)
);
