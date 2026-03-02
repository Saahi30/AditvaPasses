-- Migration: Enhancing Student Signup (Patterns, OTP prep, and Student Details)

-- 1. Add email validation patterns to Colleges
alter table colleges add column if not exists email_domain text; -- e.g. 'mit.edu'
alter table colleges add column if not exists email_placeholder text default 'student@college.edu';

-- 2. Add Student-specific fields to Profiles
alter table profiles add column if not exists course text;
alter table profiles add column if not exists year text;
alter table profiles add column if not exists degree text;
alter table profiles add column if not exists batch text;

-- 3. Update RLS for profiles to allow students to update their own extra fields
create policy "Users can update their own extra student fields" on profiles
  for update using (auth.uid() = id);
