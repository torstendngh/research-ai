-- Add the per-project chat response-length preference.
-- Run via the Supabase SQL editor or `supabase db push`.

alter table public.projects
    add column if not exists response_length text not null default 'balanced';
