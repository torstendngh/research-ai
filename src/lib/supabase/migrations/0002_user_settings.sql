-- Per-user settings, including custom AI instructions.
-- Run via the Supabase SQL editor or `supabase db push`.

create table if not exists public.user_settings (
    owner_id     uuid primary key references auth.users (id) on delete cascade,
    instructions text not null default '',
    updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security (defense-in-depth; server actions use the service role
-- and also filter by owner explicitly).
-- ---------------------------------------------------------------------------
alter table public.user_settings enable row level security;

drop policy if exists "user_settings owner access" on public.user_settings;
create policy "user_settings owner access" on public.user_settings
    for all
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());
