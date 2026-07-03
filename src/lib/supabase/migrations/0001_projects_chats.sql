-- Projects, chats, and chat messages.
-- Run via the Supabase SQL editor or `supabase db push`.
-- Requires the pgcrypto extension for gen_random_uuid().

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
    id          uuid primary key default gen_random_uuid(),
    owner_id    uuid not null references auth.users (id) on delete cascade,
    title       text not null default 'Untitled project',
    description text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index if not exists projects_owner_id_idx
    on public.projects (owner_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- chats
-- ---------------------------------------------------------------------------
create table if not exists public.chats (
    id          uuid primary key default gen_random_uuid(),
    project_id  uuid not null references public.projects (id) on delete cascade,
    owner_id    uuid not null references auth.users (id) on delete cascade,
    title       text not null default 'New chat',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index if not exists chats_project_id_idx
    on public.chats (project_id, updated_at desc);

create index if not exists chats_owner_id_idx
    on public.chats (owner_id);

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
    id          uuid primary key default gen_random_uuid(),
    chat_id     uuid not null references public.chats (id) on delete cascade,
    role        text not null check (role in ('user', 'assistant')),
    content     text not null,
    citations   jsonb,
    created_at  timestamptz not null default now()
);

create index if not exists chat_messages_chat_id_idx
    on public.chat_messages (chat_id, created_at asc);

-- ---------------------------------------------------------------------------
-- link sources to a project (rag_sources already has owner_id)
-- ---------------------------------------------------------------------------
alter table public.rag_sources
    add column if not exists project_id uuid references public.projects (id) on delete cascade;

create index if not exists rag_sources_project_id_idx
    on public.rag_sources (project_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (defense-in-depth; server actions use the service role
-- and also filter by owner explicitly).
-- ---------------------------------------------------------------------------
alter table public.projects      enable row level security;
alter table public.chats         enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "projects owner access" on public.projects;
create policy "projects owner access" on public.projects
    for all
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

drop policy if exists "chats owner access" on public.chats;
create policy "chats owner access" on public.chats
    for all
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

-- chat_messages have no owner_id; scope them through the parent chat.
drop policy if exists "chat_messages owner access" on public.chat_messages;
create policy "chat_messages owner access" on public.chat_messages
    for all
    using (
        exists (
            select 1 from public.chats c
            where c.id = chat_messages.chat_id
              and c.owner_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.chats c
            where c.id = chat_messages.chat_id
              and c.owner_id = auth.uid()
        )
    );
