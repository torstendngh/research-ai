-- Add generated key topics to projects (shown on the overview page).
-- Run via the Supabase SQL editor or `supabase db push`.

alter table public.projects
    add column if not exists topics jsonb not null default '[]'::jsonb;
