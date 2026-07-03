-- Per-project AI-generated podcast episodes. The audio lives in the private
-- `podcasts` storage bucket; a row is inserted only once generation succeeds.
-- Run via the Supabase SQL editor or `supabase db push`.

create table if not exists public.project_podcasts (
    id               uuid primary key default gen_random_uuid(),
    project_id       uuid not null references public.projects (id) on delete cascade,
    owner_id         uuid not null references auth.users (id) on delete cascade,
    title            text not null,
    prompt           text not null,
    script           jsonb not null default '[]'::jsonb,
    audio_path       text not null,
    duration_seconds integer not null default 0,
    created_at       timestamptz not null default now()
);

create index if not exists project_podcasts_project_id_idx
    on public.project_podcasts (project_id);

create index if not exists project_podcasts_owner_id_idx
    on public.project_podcasts (owner_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (server actions use the service role and also filter by
-- owner explicitly; this is defense-in-depth).
-- ---------------------------------------------------------------------------
alter table public.project_podcasts enable row level security;

drop policy if exists "project_podcasts owner access" on public.project_podcasts;
create policy "project_podcasts owner access" on public.project_podcasts
    for all
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Private bucket for the generated audio. The server writes with the service
-- role and hands out short-lived signed URLs, so no storage policies needed.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('podcasts', 'podcasts', false)
on conflict (id) do nothing;
