// Plain server module (not "use server"): only called from auth-checked server
// actions, so it must not be exposed as an action endpoint itself — it accepts
// an arbitrary ownerId (same rationale as ask.ts).

import {
    ANSWER_MODEL,
    DEFAULT_CONTEXT_TOKEN_LIMIT,
    openai,
    supabase,
} from "./config";
import { embedTexts } from "./openai";
import { roughTokenCount, takeFirstApproxTokens } from "./token-utils";
import type { HybridSearchHit, ParentChunkRow, SourceRow } from "./types";

export type QuizCard = {
    question: string;
    answer: string;
};

export type GeneratedQuizDeck = {
    title: string;
    cards: QuizCard[];
};

// A deck covers more ground than a chat answer, so retrieve wider.
const QUIZ_MATCH_COUNT = 18;

const DECK_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        title: { type: "string" },
        cards: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                },
                required: ["question", "answer"],
            },
        },
    },
    required: ["title", "cards"],
};

/**
 * Generate a quiz card deck for a project: retrieve the source material
 * relevant to the prompt and turn it into question/answer flip cards. Returns
 * null when the project has no ready sources or nothing relevant was found.
 */
export async function generateQuizDeck(input: {
    ownerId: string;
    projectId: string;
    prompt: string;
}): Promise<GeneratedQuizDeck | null> {
    const context = await retrieveContext(input);
    if (!context) return null;

    const deck = await generateDeck(input.prompt, context);
    const cards = deck.cards
        .map((card) => ({
            question: card.question.trim(),
            answer: card.answer.trim(),
        }))
        .filter((card) => card.question.length > 0 && card.answer.length > 0);

    if (cards.length === 0) return null;

    return {
        title: deck.title.trim() || "Untitled deck",
        cards,
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
        match_count: QUIZ_MATCH_COUNT,
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

async function generateDeck(prompt: string, context: string): Promise<GeneratedQuizDeck> {
    const response = await openai.responses.create({
        model: ANSWER_MODEL,
        instructions: [
            "You create a deck of quiz flip cards for studying, based strictly on the provided source material.",
            "Each card has a question on the front and the answer on the back.",
            "Write 8 to 16 cards, depending on how much the material covers about the requested topic.",
            "Mix card styles: definitions, key facts (names, dates, numbers), and why/how questions that test understanding.",
            "Questions must be self-contained — answerable without seeing the sources or the other cards.",
            "Keep answers short and direct: one to three sentences, no lists, no citation markers.",
            "Only use facts from the source material; if it does not cover something, do not invent it.",
            "Also return a short, descriptive deck title of at most 8 words.",
        ].join("\n"),
        input: `Deck brief:\n${prompt}\n\nSource material:\n${context}`,
        text: {
            format: {
                type: "json_schema",
                name: "quiz_deck",
                strict: true,
                schema: DECK_SCHEMA,
            },
        },
        max_output_tokens: 4000,
    });

    return JSON.parse(response.output_text) as GeneratedQuizDeck;
}
