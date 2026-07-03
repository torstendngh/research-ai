-- Per-source on/off toggle. When a source is disabled it stays ingested and
-- counts toward storage, but the project's tools (chat, mind map, podcasts,
-- quiz) skip it during retrieval. Existing sources default to enabled.
-- Run via the Supabase SQL editor or `supabase db push`.

alter table public.rag_sources
    add column if not exists enabled boolean not null default true;
