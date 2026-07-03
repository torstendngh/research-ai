import { EMBEDDING_MODEL, SUMMARY_MODEL, openai } from "./config";
import { takeFirstApproxTokens } from "./token-utils";
import type { ParentChunkDraft } from "./types";

// The embedding API rejects inputs over 8192 tokens. Chunks are far smaller in
// normal prose, but token estimates are rough, so clamp hard by characters:
// 8000 chars stays under the limit even for scripts that tokenize near one
// token per character, while legitimate chunks (~420 tokens) never get cut.
const EMBED_MAX_CHARS = 8000;

export async function embedTexts(texts: string[]): Promise<number[][]> {
    const cleanedTexts = texts.map((text) => {
        return text.replace(/\s+/g, " ").trim().slice(0, EMBED_MAX_CHARS);
    });

    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: cleanedTexts,
    });

    return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
}

export async function summarizeParentChunk(parent: ParentChunkDraft): Promise<string> {
    const shortContent = takeFirstApproxTokens(parent.content, 1800);

    const response = await openai.responses.create({
        model: SUMMARY_MODEL,
        instructions: [
            "Summarize this source chunk for retrieval.",
            "Keep names, dates, terms, definitions, requirements, numbers, and decisions.",
            "Maximum 4 concise bullet points.",
        ].join("\n"),
        input: shortContent,
    });

    return response.output_text.trim();
}
