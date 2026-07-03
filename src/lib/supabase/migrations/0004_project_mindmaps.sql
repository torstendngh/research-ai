-- Per-project AI-generated mind map. Regenerated when the project's ready
-- sources change (tracked via `signature`).
-- Run via the Supabase SQL editor or `supabase db push`.

create table if not exists public.project_mindmaps (
    project_id  uuid primary key references public.projects (id) on delete cascade,
    owner_id    uuid not null references auth.users (id) on delete cascade,
    title       text not null default '',
    graph       jsonb not null default '{"title":"","nodes":[]}'::jsonb,
    signature   text not null default '',
    updated_at  timestamptz not null default now()
);

create index if not exists project_mindmaps_owner_id_idx
    on public.project_mindmaps (owner_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (server actions use the service role and also filter by
-- owner explicitly; this is defense-in-depth).
-- ---------------------------------------------------------------------------
alter table public.project_mindmaps enable row level security;

drop policy if exists "project_mindmaps owner access" on public.project_mindmaps;
create policy "project_mindmaps owner access" on public.project_mindmaps
    for all
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());
