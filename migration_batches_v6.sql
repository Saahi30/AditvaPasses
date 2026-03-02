-- Migration: Add batches to Colleges
alter table colleges add column if not exists batches text[] default '{"2021", "2022", "2023", "2024", "2025"}';
