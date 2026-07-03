-- Per-project AI-generated quiz card decks. The cards live inline as jsonb:
-- an array of { question, answer, correct } objects, where `correct` records
-- the user's last self-graded result (true/false, null when unanswered). A
-- row is inserted only once generation succeeds.
-- Run via the Supabase SQL editor or `supabase db push`.

create table if not exists public.project_quiz_decks (
    id         uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects (id) on delete cascade,
    owner_id   uuid not null references auth.users (id) on delete cascade,
    title      text not null,
    prompt     text not null,
    cards      jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists project_quiz_decks_project_id_idx
    on public.project_quiz_decks (project_id);

create index if not exists project_quiz_decks_owner_id_idx
    on public.project_quiz_decks (owner_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (server actions use the service role and also filter by
-- owner explicitly; this is defense-in-depth).
-- ---------------------------------------------------------------------------
alter table public.project_quiz_decks enable row level security;

drop policy if exists "project_quiz_decks owner access" on public.project_quiz_decks;
create policy "project_quiz_decks owner access" on public.project_quiz_decks
    for all
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Allow the new kind in the usage ledger (limit lives in src/lib/usage.ts).
-- ---------------------------------------------------------------------------
alter table public.usage_events drop constraint if exists usage_events_kind_check;
alter table public.usage_events add constraint usage_events_kind_check
    check (kind in ('chat_message', 'source_ingest', 'podcast', 'quiz_deck'));
