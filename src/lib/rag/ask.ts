// Plain server module (not "use server"): these functions are only called from
// auth-checked server actions and route handlers, so they must not be exposed
// as action endpoints themselves — they accept an arbitrary ownerId.

import {
    ANSWER_MODEL,
    DEFAULT_CONTEXT_TOKEN_LIMIT,
    DEFAULT_MATCH_COUNT,
    HISTORY_TURN_MAX_TOKENS,
    MAX_HISTORY_TURNS,
    REWRITE_MODEL,
    openai,
    supabase,
} from "./config";
import { embedTexts } from "./openai";
import { roughTokenCount, takeFirstApproxTokens } from "./token-utils";
import {
    DEFAULT_RESPONSE_LENGTH,
    RESPONSE_LENGTH_DIRECTIVE,
    RESPONSE_LENGTH_MAX_TOKENS,
} from "@/lib/settings";
import type {
    AskQuestionInput,
    AskQuestionResult,
    AskQuestionStreamResult,
    ChatTurn,
    HybridSearchHit,
    ParentChunkRow,
    RagCitation,
    SourceRow,
} from "./types";

/**
 * Everything `askQuestion` and `askQuestionStream` share: query rewriting,
 * hybrid retrieval, parent expansion, and prompt assembly. `kind: "empty"`
 * means there is nothing to generate — the answer is already final.
 */
type PreparedAsk =
    | { kind: "empty"; answer: string }
    | {
        kind: "ready";
        instructions: string;
        promptInput: string;
        maxOutputTokens: number;
        citations: RagCitation[];
    };

export async function askQuestion(input: AskQuestionInput): Promise<AskQuestionResult> {
    const prepared = await prepareAsk(input);

    if (prepared.kind === "empty") {
        return { answer: prepared.answer, citations: [] };
    }

    const response = await openai.responses.create({
        model: ANSWER_MODEL,
        instructions: prepared.instructions,
        input: prepared.promptInput,
        max_output_tokens: prepared.maxOutputTokens,
    });

    return {
        answer: response.output_text.trim(),
        citations: prepared.citations,
    };
}

/**
 * Streaming variant of `askQuestion`. Retrieval happens up front, so citations
 * are available immediately; the answer text arrives as deltas.
 */
export async function askQuestionStream(input: AskQuestionInput): Promise<AskQuestionStreamResult> {
    const prepared = await prepareAsk(input);

    if (prepared.kind === "empty") {
        return {
            citations: [],
            stream: (async function* () {
                yield prepared.answer;
            })(),
        };
    }

    const events = await openai.responses.create({
        model: ANSWER_MODEL,
        instructions: prepared.instructions,
        input: prepared.promptInput,
        max_output_tokens: prepared.maxOutputTokens,
        stream: true,
    });

    return {
        citations: prepared.citations,
        stream: (async function* () {
            for await (const event of events) {
                if (event.type === "response.output_text.delta") {
                    yield event.delta;
                }
            }
        })(),
    };
}

async function prepareAsk(input: AskQuestionInput): Promise<PreparedAsk> {
    const question = input.question.trim();

    if (!question) {
        return { kind: "empty", answer: "No question was provided." };
    }

    const history = (input.history ?? []).slice(-MAX_HISTORY_TURNS);

    // Follow-ups like "explain that more simply" are useless as search queries.
    // With history present, condense the latest message into a standalone query
    // before embedding it; the original question is still what gets answered.
    const retrievalQuery = history.length > 0
        ? await rewriteForRetrieval(question, history)
        : question;

    const [queryEmbedding] = await embedTexts([retrievalQuery]);

    const { data: hits, error: searchError } = await supabase.rpc("rag_hybrid_search", {
        query_text: retrievalQuery,
        query_embedding: queryEmbedding,
        match_count: input.matchCount ?? DEFAULT_MATCH_COUNT,
        source_filter: input.sourceIds && input.sourceIds.length > 0 ? input.sourceIds : null,
        owner_filter: input.ownerId ?? null,
    });

    if (searchError) throw searchError;

    const searchHits = (hits ?? []) as HybridSearchHit[];

    if (searchHits.length === 0) {
        return {
            kind: "empty",
            answer: "I could not find relevant information in the uploaded material.",
        };
    }

    const parentScoreMap = new Map<string, number>();

    for (const hit of searchHits) {
        const currentScore = parentScoreMap.get(hit.parent_id) ?? 0;
        parentScoreMap.set(hit.parent_id, Math.max(currentScore, hit.score));
    }

    const parentIds = Array.from(parentScoreMap.keys());

    const { data: parents, error: parentsError } = await supabase
        .from("rag_parent_chunks")
        .select("id, source_id, title, heading_path, content, summary, page_start, page_end, token_count")
        .in("id", parentIds);

    if (parentsError) throw parentsError;

    const parentRows = ((parents ?? []) as ParentChunkRow[]).sort((a, b) => {
        return (parentScoreMap.get(b.id) ?? 0) - (parentScoreMap.get(a.id) ?? 0);
    });

    const sourceIds = Array.from(new Set(parentRows.map((parent) => parent.source_id)));

    const { data: sources, error: sourcesError } = await supabase
        .from("rag_sources")
        .select("id, title, url, file_name, source_type")
        .in("id", sourceIds);

    if (sourcesError) throw sourcesError;

    const sourceMap = new Map<string, SourceRow>();

    for (const source of (sources ?? []) as SourceRow[]) {
        sourceMap.set(source.id, source);
    }

    const packed = packContext({
        parents: parentRows,
        sourceMap,
        tokenLimit: input.contextTokenLimit ?? DEFAULT_CONTEXT_TOKEN_LIMIT,
    });

    const instructionLines = [
        "You answer questions using only the provided source material.",
        "If the source material does not contain the answer, say that the material does not specify it.",
        "Cite sources using the provided markers like [S1], [S2].",
        "Be precise. Do not invent missing facts.",
    ];

    if (history.length > 0) {
        instructionLines.push(
            "The conversation so far is included for context. Answer only the latest question.",
        );
    }

    const responseLength = input.responseLength ?? DEFAULT_RESPONSE_LENGTH;
    const lengthDirective = RESPONSE_LENGTH_DIRECTIVE[responseLength];

    if (lengthDirective) {
        instructionLines.push(lengthDirective);
    }

    const userInstructions = input.instructions?.trim();

    if (userInstructions) {
        instructionLines.push(
            "",
            "The user provided the following custom instructions. Follow them unless they conflict with the rules above:",
            userInstructions,
        );
    }

    const promptSections = [
        history.length > 0 ? `Conversation so far:\n${formatHistory(history)}` : null,
        `Question:\n${question}`,
        `Source material:\n${packed.context}`,
    ].filter(Boolean);

    return {
        kind: "ready",
        instructions: instructionLines.join("\n"),
        promptInput: promptSections.join("\n\n"),
        maxOutputTokens: RESPONSE_LENGTH_MAX_TOKENS[responseLength],
        citations: packed.citations,
    };
}

/**
 * Condense the latest message plus conversation into one standalone search
 * query. Falls back to the raw question on any failure — retrieval still works,
 * just without reference resolution.
 */
async function rewriteForRetrieval(question: string, history: ChatTurn[]): Promise<string> {
    try {
        const response = await openai.responses.create({
            model: REWRITE_MODEL,
            instructions: [
                "Rewrite the user's latest message as a single standalone search query.",
                "Resolve pronouns and references ('it', 'that', 'the second one') using the conversation.",
                "Keep the user's language and key terms.",
                "Return only the rewritten query, nothing else.",
            ].join("\n"),
            input: `Conversation:\n${formatHistory(history)}\n\nLatest message:\n${question}`,
            max_output_tokens: 400,
        });

        return response.output_text.trim() || question;
    } catch {
        return question;
    }
}

function formatHistory(history: ChatTurn[]): string {
    return history
        .map((turn) => {
            const label = turn.role === "user" ? "User" : "Assistant";
            const content = roughTokenCount(turn.content) > HISTORY_TURN_MAX_TOKENS
                ? `${takeFirstApproxTokens(turn.content, HISTORY_TURN_MAX_TOKENS)} […]`
                : turn.content;

            return `${label}: ${content}`;
        })
        .join("\n");
}

function packContext(input: {
    parents: ParentChunkRow[];
    sourceMap: Map<string, SourceRow>;
    tokenLimit: number;
}): {
    context: string;
    citations: RagCitation[];
} {
    const blocks: string[] = [];
    const citations: RagCitation[] = [];
    let usedTokens = 0;

    for (const parent of input.parents) {
        const source = input.sourceMap.get(parent.source_id);
        const marker = `S${citations.length + 1}`;

        const header = [
            `[${marker}]`,
            `Title: ${source?.title ?? parent.title}`,
            source?.url ? `URL: ${source.url}` : null,
            source?.file_name ? `File: ${source.file_name}` : null,
            parent.page_start || parent.page_end
                ? `Pages: ${parent.page_start ?? "?"}-${parent.page_end ?? "?"}`
                : null,
            parent.heading_path.length > 0
                ? `Section: ${parent.heading_path.join(" > ")}`
                : null,
        ]
            .filter(Boolean)
            .join("\n");

        const block = `${header}\n\n${parent.content}`;
        const blockTokens = roughTokenCount(block);

        if (usedTokens + blockTokens > input.tokenLimit) {
            const remaining = input.tokenLimit - usedTokens;
            if (remaining < 500) break;

            blocks.push(`${header}\n\n${takeFirstApproxTokens(parent.content, remaining)}`);
            usedTokens = input.tokenLimit;
        } else {
            blocks.push(block);
            usedTokens += blockTokens;
        }

        citations.push({
            marker,
            sourceId: parent.source_id,
            parentId: parent.id,
            title: source?.title ?? parent.title,
            url: source?.url ?? null,
            fileName: source?.file_name ?? null,
            pageStart: parent.page_start,
            pageEnd: parent.page_end,
            headingPath: parent.heading_path,
        });

        if (usedTokens >= input.tokenLimit) break;
    }

    return {
        context: blocks.join("\n\n---\n\n"),
        citations,
    };
}
