import type { ResponseLength } from "@/lib/settings";

export type SourceType = "pdf" | "url" | "text";
export type BlockType = "heading" | "paragraph" | "table" | "list" | "caption";

export type TextBlock = {
    type: BlockType;
    text: string;
    page?: number;
    level?: number;
    headingPath?: string[];
};

export type ExtractedSource = {
    sourceType: SourceType;
    title: string;
    url?: string;
    canonicalUrl?: string;
    fileName?: string;
    contentHash: string;
    blocks: TextBlock[];
};

export type ParentChunkDraft = {
    title: string;
    headingPath: string[];
    content: string;
    pageStart: number | null;
    pageEnd: number | null;
    tokenCount: number;
};

export type ChildChunkDraft = {
    content: string;
    searchableText: string;
    headingPath: string[];
    pageStart: number | null;
    pageEnd: number | null;
    chunkIndex: number;
    tokenCount: number;
};

export type IngestPdfInput = {
    type: "pdf";
    fileName: string;
    fileBuffer: Buffer | ArrayBuffer | Uint8Array;
    ownerId?: string;
    projectId?: string;
    forceReindex?: boolean;
    generateSummaries?: boolean;
};

export type IngestUrlInput = {
    type: "url";
    url: string;
    ownerId?: string;
    projectId?: string;
    forceReindex?: boolean;
    generateSummaries?: boolean;
};

export type IngestTextInput = {
    type: "text";
    title: string;
    text: string;
    ownerId?: string;
    projectId?: string;
    forceReindex?: boolean;
    generateSummaries?: boolean;
};

export type IngestSourceInput = IngestPdfInput | IngestUrlInput | IngestTextInput;

export type IngestSourceResult = {
    sourceId: string;
    reusedExisting: boolean;
    parentChunkCount: number;
    childChunkCount: number;
};

/** One prior turn of the conversation, oldest first. */
export type ChatTurn = {
    role: "user" | "assistant";
    content: string;
};

export type AskQuestionInput = {
    question: string;
    ownerId?: string;
    sourceIds?: string[];
    matchCount?: number;
    contextTokenLimit?: number;
    /** Custom, user-provided instructions appended to the system prompt. */
    instructions?: string;
    /** Preferred answer length; shapes the system prompt and token cap. */
    responseLength?: ResponseLength;
    /**
     * Prior conversation turns (oldest first). Used to resolve follow-up
     * questions ("explain that more") into standalone retrieval queries and to
     * give the answer model the conversational context.
     */
    history?: ChatTurn[];
};

export type RagCitation = {
    marker: string;
    sourceId: string;
    parentId: string;
    title: string;
    url: string | null;
    fileName: string | null;
    pageStart: number | null;
    pageEnd: number | null;
    headingPath: string[];
};

export type AskQuestionResult = {
    answer: string;
    citations: RagCitation[];
};

export type AskQuestionStreamResult = {
    /** Known before the answer starts — retrieval happens up front. */
    citations: RagCitation[];
    /** Answer text, yielded as deltas in generation order. */
    stream: AsyncIterable<string>;
};

export type HybridSearchHit = {
    child_id: string;
    parent_id: string;
    source_id: string;
    content: string;
    heading_path: string[];
    page_start: number | null;
    page_end: number | null;
    vector_rank: number | null;
    keyword_rank: number | null;
    score: number;
};

export type ParentChunkRow = {
    id: string;
    source_id: string;
    title: string;
    heading_path: string[];
    content: string;
    summary: string | null;
    page_start: number | null;
    page_end: number | null;
    token_count: number;
};

export type SourceRow = {
    id: string;
    title: string;
    url: string | null;
    file_name: string | null;
    source_type: SourceType;
};
