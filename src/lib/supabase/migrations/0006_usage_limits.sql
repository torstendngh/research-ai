-- Per-user usage limits: a ledger of countable actions (chat replies, source
-- ingests, podcast generations) plus byte-size columns so total storage can be
-- computed. Limits themselves live in code (src/lib/usage.ts).
-- Run via the Supabase SQL editor or `supabase db push`.

create table if not exists public.usage_events (
    id         uuid primary key default gen_random_uuid(),
    owner_id   uuid not null references auth.users (id) on delete cascade,
    kind       text not null check (kind in ('chat_message', 'source_ingest', 'podcast')),
    created_at timestamptz not null default now()
);

-- Counting events of one kind since a window start is the only query pattern.
create index if not exists usage_events_owner_kind_created_idx
    on public.usage_events (owner_id, kind, created_at desc);

-- Service-role only: RLS enabled with no policies denies all client access.
alter table public.usage_events enable row level security;

-- ---------------------------------------------------------------------------
-- Storage accounting: how many bytes each stored artifact occupies.
--   * rag_sources.byte_size — PDF file size, or extracted text size for URLs
--   * project_podcasts.audio_bytes — size of the generated MP3
-- ---------------------------------------------------------------------------
alter table public.rag_sources
    add column if not exists byte_size bigint not null default 0;

alter table public.project_podcasts
    add column if not exists audio_bytes bigint not null default 0;
