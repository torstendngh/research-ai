// Plain server module (not "use server"): only called from auth-checked server
// actions, so it must not be exposed as an action endpoint itself — it accepts
// an arbitrary ownerId (same rationale as ask.ts).

import {
    ANSWER_MODEL,
    DEFAULT_CONTEXT_TOKEN_LIMIT,
    TTS_MODEL,
    openai,
    supabase,
} from "./config";
import { embedTexts } from "./openai";
import { roughTokenCount, takeFirstApproxTokens } from "./token-utils";
import type { HybridSearchHit, ParentChunkRow, SourceRow } from "./types";

export type PodcastSpeaker = "host" | "cohost";

export type PodcastSegment = {
    speaker: PodcastSpeaker;
    text: string;
};

export type GeneratedPodcast = {
    title: string;
    segments: PodcastSegment[];
    /** The full episode as a single MP3. */
    audio: Buffer;
    /** Estimated from the script's word count (~153 wpm speaking rate). */
    durationSeconds: number;
};

// An episode covers more ground than a chat answer, so retrieve wider.
const PODCAST_MATCH_COUNT = 18;

// ~1,100–1,500 spoken words lands the episode in the 7–9 minute range.
const WORDS_PER_SECOND = 2.55;

// The TTS endpoint rejects inputs over 4096 characters; stay safely under it.
const TTS_MAX_CHARS = 3500;
const TTS_CONCURRENCY = 4;

const VOICE_BY_SPEAKER: Record<PodcastSpeaker, string> = {
    host: "nova",
    cohost: "onyx",
};

const DELIVERY_BY_SPEAKER: Record<PodcastSpeaker, string> = {
    host: "Warm, upbeat podcast host. Conversational pace, clear articulation.",
    cohost: "Calm, thoughtful expert. Measured pace, engaged and friendly.",
};

const SCRIPT_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        title: { type: "string" },
        segments: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    speaker: { type: "string", enum: ["host", "cohost"] },
                    text: { type: "string" },
                },
                required: ["speaker", "text"],
            },
        },
    },
    required: ["title", "segments"],
};

type PodcastScript = {
    title: string;
    segments: PodcastSegment[];
};

/**
 * Generate a full podcast episode for a project: retrieve the source material
 * relevant to the prompt, write a two-host script, and synthesize it into one
 * MP3. Returns null when the project has no ready sources or nothing relevant
 * was found.
 */
export async function generatePodcastEpisode(input: {
    ownerId: string;
    projectId: string;
    prompt: string;
}): Promise<GeneratedPodcast | null> {
    const context = await retrieveContext(input);
    if (!context) return null;

    const script = await generateScript(input.prompt, context);
    const segments = script.segments.filter((segment) => segment.text.trim().length > 0);
    if (segments.length === 0) return null;

    // Segments over the TTS input limit are split on sentence boundaries; each
    // piece keeps its speaker so the voice never changes mid-thought.
    const pieces = segments.flatMap((segment) =>
        splitForTts(segment.text).map((text) => ({ speaker: segment.speaker, text })),
    );

    const buffers = await synthesize(pieces);

    const wordCount = segments.reduce(
        (sum, segment) => sum + segment.text.split(/\s+/).filter(Boolean).length,
        0,
    );

    return {
        title: script.title.trim() || "Untitled episode",
        segments,
        audio: Buffer.concat(buffers),
        durationSeconds: Math.round(wordCount / WORDS_PER_SECOND),
    };
}

/**
 * Hybrid retrieval scoped to the project's ready sources (same pattern as
 * ask.ts), packed into one context string. Null when there is nothing to use.
 */
async function retrieveContext(input: {
    ownerId: string;
    projectId: string;
    prompt: string;
}): Promise<string | null> {
    const { data: sourceRows, error: sourcesError } = await supabase
        .from("rag_sources")
        .select("id, title, url, file_name, source_type")
        .eq("owner_id", input.ownerId)
        .eq("project_id", input.projectId)
        .eq("status", "ready")
        .eq("enabled", true);

    if (sourcesError) throw sourcesError;

    const sources = (sourceRows ?? []) as SourceRow[];
    if (sources.length === 0) return null;

    const [queryEmbedding] = await embedTexts([input.prompt]);

    const { data: hits, error: searchError } = await supabase.rpc("rag_hybrid_search", {
        query_text: input.prompt,
        query_embedding: queryEmbedding,
        match_count: PODCAST_MATCH_COUNT,
        source_filter: sources.map((source) => source.id),
        owner_filter: input.ownerId,
    });

    if (searchError) throw searchError;

    const searchHits = (hits ?? []) as HybridSearchHit[];
    if (searchHits.length === 0) return null;

    const parentScoreMap = new Map<string, number>();
    for (const hit of searchHits) {
        const currentScore = parentScoreMap.get(hit.parent_id) ?? 0;
        parentScoreMap.set(hit.parent_id, Math.max(currentScore, hit.score));
    }

    const { data: parents, error: parentsError } = await supabase
        .from("rag_parent_chunks")
        .select("id, source_id, title, heading_path, content, summary, page_start, page_end, token_count")
        .in("id", Array.from(parentScoreMap.keys()));

    if (parentsError) throw parentsError;

    const parentRows = ((parents ?? []) as ParentChunkRow[]).sort((a, b) => {
        return (parentScoreMap.get(b.id) ?? 0) - (parentScoreMap.get(a.id) ?? 0);
    });

    const sourceMap = new Map(sources.map((source) => [source.id, source]));

    const blocks: string[] = [];
    let usedTokens = 0;

    for (const parent of parentRows) {
        const source = sourceMap.get(parent.source_id);
        const header = [
            `Source: ${source?.title ?? parent.title}`,
            parent.heading_path.length > 0
                ? `Section: ${parent.heading_path.join(" > ")}`
                : null,
        ]
            .filter(Boolean)
            .join("\n");

        const block = `${header}\n\n${parent.content}`;
        const blockTokens = roughTokenCount(block);

        if (usedTokens + blockTokens > DEFAULT_CONTEXT_TOKEN_LIMIT) {
            const remaining = DEFAULT_CONTEXT_TOKEN_LIMIT - usedTokens;
            if (remaining < 500) break;
            blocks.push(`${header}\n\n${takeFirstApproxTokens(parent.content, remaining)}`);
            break;
        }

        blocks.push(block);
        usedTokens += blockTokens;
    }

    return blocks.join("\n\n---\n\n");
}

async function generateScript(prompt: string, context: string): Promise<PodcastScript> {
    const response = await openai.responses.create({
        model: ANSWER_MODEL,
        instructions: [
            "You write the script for one episode of a two-person research podcast, based strictly on the provided source material.",
            "Speakers: \"host\" leads the show, frames the topic, and asks the questions listeners would ask; \"cohost\" is the expert who explains the details, numbers, and examples.",
            "Write for the ear: conversational sentences, natural back-and-forth, occasional reactions. No lists, no citation markers, no stage directions, no sound effects, no speaker names inside the text.",
            "Open with a short hook and a one-line intro of the episode topic; end with a brief recap and sign-off.",
            "Aim for 1,100 to 1,500 words of dialogue in total (roughly 7 to 9 minutes of audio).",
            "Alternate speakers naturally, in segments of about 2 to 5 sentences each.",
            "Only use facts from the source material; if it does not cover something, do not invent it.",
            "Also return a short, catchy episode title of at most 8 words.",
        ].join("\n"),
        input: `Episode brief:\n${prompt}\n\nSource material:\n${context}`,
        text: {
            format: {
                type: "json_schema",
                name: "podcast_script",
                strict: true,
                schema: SCRIPT_SCHEMA,
            },
        },
        max_output_tokens: 6000,
    });

    return JSON.parse(response.output_text) as PodcastScript;
}

/** Split text into TTS-sized pieces on sentence boundaries. */
function splitForTts(text: string): string[] {
    const trimmed = text.trim();
    if (trimmed.length <= TTS_MAX_CHARS) return [trimmed];

    const sentences = trimmed.match(/[^.!?]+[.!?]*\s*/g) ?? [trimmed];
    const pieces: string[] = [];
    let current = "";

    for (const sentence of sentences) {
        if (current && current.length + sentence.length > TTS_MAX_CHARS) {
            pieces.push(current.trim());
            current = "";
        }
        current += sentence;
    }
    if (current.trim()) pieces.push(current.trim());

    // A single sentence longer than the limit (degenerate, but possible) still
    // has to be hard-sliced.
    return pieces.flatMap((piece) =>
        piece.length <= TTS_MAX_CHARS
            ? [piece]
            : piece.match(new RegExp(`.{1,${TTS_MAX_CHARS}}`, "gs")) ?? [piece],
    );
}

/**
 * Synthesize every piece with the voice of its speaker, a few at a time, and
 * return the MP3 buffers in script order (MP3 frames concatenate cleanly).
 */
async function synthesize(
    pieces: { speaker: PodcastSpeaker; text: string }[],
): Promise<Buffer[]> {
    const buffers = new Array<Buffer>(pieces.length);
    let next = 0;

    const worker = async () => {
        while (next < pieces.length) {
            const index = next;
            next += 1;
            const piece = pieces[index];

            const response = await openai.audio.speech.create({
                model: TTS_MODEL,
                voice: VOICE_BY_SPEAKER[piece.speaker],
                input: piece.text,
                response_format: "mp3",
                // `instructions` is only supported by the gpt-* TTS models;
                // tts-1/tts-1-hd (possible env overrides) reject it.
                ...(TTS_MODEL.startsWith("gpt-")
                    ? { instructions: DELIVERY_BY_SPEAKER[piece.speaker] }
                    : {}),
            });

            buffers[index] = Buffer.from(await response.arrayBuffer());
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(TTS_CONCURRENCY, pieces.length) }, worker),
    );

    return buffers;
}
