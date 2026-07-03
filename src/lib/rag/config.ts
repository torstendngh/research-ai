import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing.");

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
    },
});

export const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const ANSWER_MODEL = process.env.OPENAI_ANSWER_MODEL ?? "gpt-5.5";
export const SUMMARY_MODEL = process.env.OPENAI_SUMMARY_MODEL ?? ANSWER_MODEL;
export const REWRITE_MODEL = process.env.OPENAI_REWRITE_MODEL ?? ANSWER_MODEL;
// Cheapest decent-quality TTS (~$0.015 per minute of audio); supports per-call
// voice + delivery instructions, which the two-host podcast relies on.
export const TTS_MODEL = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";

export const PARENT_TARGET_TOKENS = 1500;
export const PARENT_MAX_TOKENS = 2500;
export const CHILD_TARGET_TOKENS = 420;
export const CHILD_OVERLAP_TOKENS = 70;
export const DEFAULT_MATCH_COUNT = 12;
export const DEFAULT_CONTEXT_TOKEN_LIMIT = 12000;

// Conversation history passed to the answer model: how many prior turns, and
// how much of each turn (long assistant answers get truncated so history never
// crowds out the retrieved source material).
export const MAX_HISTORY_TURNS = 6;
export const HISTORY_TURN_MAX_TOKENS = 300;
