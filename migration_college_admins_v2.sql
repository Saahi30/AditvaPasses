-- Migration: Add password change requirement for newly created admins
alter table profiles add column if not exists requires_password_change boolean default false;

-- Add a comment to track this
comment on column profiles.requires_password_change is 'Flag for college admins created by super admin to force password change on first login';
