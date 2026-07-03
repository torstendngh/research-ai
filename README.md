# ResearchAI

An AI research workspace, in the spirit of NotebookLM. Drop in your papers,
PDFs, and links; ResearchAI reads them and turns them into a grounded chat,
mind maps, flashcards, quizzes, and audio — every answer cited back to the
source material you provided.

> **Beta.** This project is under active development and not yet meant for
> important work. Data and APIs may change without notice.

## What it does

Everything is scoped to a **project** — a workspace holding a set of sources
and everything generated from them.

- **Sources** — Add material as **PDF uploads**, **web links** (fetched and
  cleaned with Mozilla Readability), or **pasted text**. Each source is
  extracted, chunked, embedded, and indexed. Duplicate content is detected by
  hash so the same source is never indexed twice.
- **Grounded chat** — Ask questions and get answers built _only_ from your
  sources, with inline `[S1]`, `[S2]` citations. Follow-ups like "explain that
  more simply" work: the retrieval query is rewritten to resolve references
  against the conversation before searching. Answers stream token by token, and
  response length and custom instructions are tunable per chat.
- **Mind maps** — Auto-generated, explorable concept graphs of a project's
  material (React Flow + Dagre layout).
- **Flashcards & quizzes** — Generated decks for studying the sources.
- **Podcasts** — A two-host audio episode generated from the material via
  text-to-speech, with an in-app player.
- **Source discovery** — Given a topic, the app web-searches for 3–5
  high-quality sources to add to the project, skipping ones already present.

## How retrieval works

Ingestion uses a **parent/child chunking** strategy: sources are split into
large parent chunks (~1500 tokens) for context and smaller overlapping child
chunks (~420 tokens) for precise matching. Child chunks are embedded with
OpenAI `text-embedding-3-small` (1536-dim).

At query time, `rag_hybrid_search` (a Postgres function) combines **pgvector**
cosine similarity with Postgres **full-text search** using Reciprocal Rank
Fusion. The best-matching children are expanded back to their parent chunks,
packed into a token budget, and handed to the answer model with strict
instructions to answer only from the provided material and to cite sources.

## Tech stack

| Layer     | Choice                                                              |
| --------- | ------------------------------------------------------------------ |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript           |
| Styling   | Tailwind CSS 4, Radix UI, Motion                                   |
| Auth      | Supabase Auth (Google OAuth), session refresh via middleware       |
| Data      | Supabase Postgres + `pgvector` for embeddings and hybrid search    |
| AI        | OpenAI — chat/answers, embeddings, `web_search`, and TTS           |
| Ingestion | `pdf-parse` (PDF), `jsdom` + `@mozilla/readability` (web pages)     |

## Getting started

**Prerequisites:** Node 20+ (developed on 22), [pnpm](https://pnpm.io), a
[Supabase](https://supabase.com) project, and an
[OpenAI API key](https://platform.openai.com).

### 1. Install

```bash
pnpm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, never expose

# OpenAI
OPENAI_API_KEY=sk-...

# Optional model overrides (defaults shown)
# OPENAI_ANSWER_MODEL=gpt-5.5
# OPENAI_SUMMARY_MODEL=gpt-5.5
# OPENAI_REWRITE_MODEL=gpt-5.5
# OPENAI_TTS_MODEL=gpt-4o-mini-tts
```

### 3. Set up the database

Apply the SQL migrations in `src/lib/supabase/migrations/` **in numerical
order** (`0000` first). They enable the `vector` and `pgcrypto` extensions,
create the RAG and application tables, add row-level security, and define the
`rag_hybrid_search` function.

Paste each file into the Supabase SQL editor and run it — the app has no
migration runner.

### 4. Configure auth

In the Supabase dashboard, enable the **Google** OAuth provider and add your
callback URL (`http://localhost:3000/auth/callback` for local dev).

### 5. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command      | Description                          |
| ------------ | ------------------------------------ |
| `pnpm dev`   | Start the dev server (Turbopack)     |
| `pnpm build` | Production build                     |
| `pnpm start` | Serve the production build           |
| `pnpm lint`  | Run ESLint                           |

## Project structure

```
src/
├── app/                    # Next.js routes
│   ├── (marketing)/        # Landing page
│   ├── (login)/            # Auth + OAuth callback
│   ├── (auth-required)/    # Dashboard (projects, chat, mind maps, …)
│   └── api/                # Route handlers (sources, chats, podcasts, quizzes)
├── components/
│   ├── landing-page/
│   ├── dashboard-page/     # The main workspace UI
│   └── shared/             # Buttons, dialogs, icons, form controls
└── lib/
    ├── rag/                # Ingestion, chunking, hybrid retrieval, generation
    ├── supabase/           # Clients, middleware, SQL migrations
    └── actions/            # Server actions
```

## Notes

- `SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security and must stay
  server-side only. The RAG helpers that accept an arbitrary `ownerId` are
  plain server modules called exclusively from auth-checked actions and route
  handlers — never exposed as server-action endpoints.
- `pdf-parse` and `jsdom` are marked as external server packages (see
  `next.config.ts`) because they rely on runtime file/dynamic-require resolution
  that bundling breaks.
