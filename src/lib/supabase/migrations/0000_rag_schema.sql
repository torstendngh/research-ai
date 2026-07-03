-- Base RAG schema required by src/lib/rag/*.
-- Reconstructed from the application code (ingest.ts, ask.ts, config.ts):
--   * embeddings come from text-embedding-3-small -> 1536 dimensions
--   * rag_hybrid_search combines pgvector cosine similarity with Postgres
--     full-text search via Reciprocal Rank Fusion (RRF).
-- Run this BEFORE 0001_projects_chats.sql.

set search_path = public, extensions;

create extension if not exists "pgcrypto";
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- rag_sources
-- ---------------------------------------------------------------------------
create table if not exists public.rag_sources (
    id            uuid primary key default gen_random_uuid(),
    owner_id      uuid references auth.users (id) on delete cascade,
    source_type   text not null check (source_type in ('pdf', 'url')),
    title         text not null,
    url           text,
    canonical_url text,
    file_name     text,
    content_hash  text not null,
    status        text not null default 'processing',
    error_message text,
    processed_at  timestamptz,
    created_at    timestamptz not null default now()
);

create index if not exists rag_sources_owner_id_idx on public.rag_sources (owner_id);
create index if not exists rag_sources_content_hash_idx on public.rag_sources (content_hash);

-- ---------------------------------------------------------------------------
-- rag_parent_chunks
-- ---------------------------------------------------------------------------
create table if not exists public.rag_parent_chunks (
    id           uuid primary key default gen_random_uuid(),
    source_id    uuid not null references public.rag_sources (id) on delete cascade,
    title        text not null,
    heading_path text[] not null default '{}',
    content      text not null,
    summary      text,
    page_start   int,
    page_end     int,
    token_count  int not null default 0,
    created_at   timestamptz not null default now()
);

create index if not exists rag_parent_chunks_source_id_idx on public.rag_parent_chunks (source_id);

-- ---------------------------------------------------------------------------
-- rag_child_chunks
-- ---------------------------------------------------------------------------
create table if not exists public.rag_child_chunks (
    id              uuid primary key default gen_random_uuid(),
    source_id       uuid not null references public.rag_sources (id) on delete cascade,
    parent_id       uuid not null references public.rag_parent_chunks (id) on delete cascade,
    content         text not null,
    searchable_text text not null,
    heading_path    text[] not null default '{}',
    page_start      int,
    page_end        int,
    chunk_index     int not null default 0,
    token_count     int not null default 0,
    embedding       extensions.vector(1536),
    created_at      timestamptz not null default now()
);

create index if not exists rag_child_chunks_source_id_idx on public.rag_child_chunks (source_id);
create index if not exists rag_child_chunks_parent_id_idx on public.rag_child_chunks (parent_id);

-- Approximate-nearest-neighbour index for cosine similarity.
create index if not exists rag_child_chunks_embedding_idx
    on public.rag_child_chunks
    using hnsw (embedding extensions.vector_cosine_ops);

-- Full-text index over the searchable text.
create index if not exists rag_child_chunks_fts_idx
    on public.rag_child_chunks
    using gin (to_tsvector('english', searchable_text));

-- ---------------------------------------------------------------------------
-- rag_hybrid_search RPC
-- Returns the columns consumed by src/lib/rag/ask.ts (HybridSearchHit).
-- ---------------------------------------------------------------------------
create or replace function public.rag_hybrid_search(
    query_text text,
    query_embedding extensions.vector(1536),
    match_count int default 12,
    source_filter uuid[] default null,
    owner_filter uuid default null
)
returns table (
    child_id uuid,
    parent_id uuid,
    source_id uuid,
    content text,
    heading_path text[],
    page_start int,
    page_end int,
    vector_rank int,
    keyword_rank int,
    score double precision
)
language sql
stable
set search_path = public, extensions
as $$
    with filtered as (
        select c.id, c.parent_id, c.source_id, c.content, c.heading_path,
               c.page_start, c.page_end, c.searchable_text, c.embedding
        from public.rag_child_chunks c
        join public.rag_sources s on s.id = c.source_id
        where (source_filter is null or c.source_id = any (source_filter))
          and (owner_filter is null or s.owner_id = owner_filter)
    ),
    vector_search as (
        select f.id as child_id,
               row_number() over (order by f.embedding <=> query_embedding) as v_rank
        from filtered f
        where f.embedding is not null
        order by f.embedding <=> query_embedding
        limit greatest(match_count * 4, 40)
    ),
    keyword_search as (
        select f.id as child_id,
               row_number() over (
                   order by ts_rank_cd(
                       to_tsvector('english', f.searchable_text),
                       plainto_tsquery('english', query_text)
                   ) desc
               ) as k_rank
        from filtered f
        where query_text is not null
          and plainto_tsquery('english', query_text) @@ to_tsvector('english', f.searchable_text)
        order by k_rank
        limit greatest(match_count * 4, 40)
    ),
    combined as (
        select coalesce(v.child_id, k.child_id) as child_id,
               v.v_rank,
               k.k_rank,
               coalesce(1.0 / (60 + v.v_rank), 0)
                   + coalesce(1.0 / (60 + k.k_rank), 0) as score
        from vector_search v
        full outer join keyword_search k on v.child_id = k.child_id
    )
    select c.id as child_id,
           c.parent_id,
           c.source_id,
           c.content,
           c.heading_path,
           c.page_start,
           c.page_end,
           comb.v_rank::int as vector_rank,
           comb.k_rank::int as keyword_rank,
           comb.score
    from combined comb
    join public.rag_child_chunks c on c.id = comb.child_id
    order by comb.score desc
    limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- RLS: deny direct client access; all reads/writes go through the service role.
-- ---------------------------------------------------------------------------
alter table public.rag_sources       enable row level security;
alter table public.rag_parent_chunks enable row level security;
alter table public.rag_child_chunks  enable row level security;
