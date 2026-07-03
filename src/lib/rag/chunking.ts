import {
    CHILD_OVERLAP_TOKENS,
    CHILD_TARGET_TOKENS,
    PARENT_MAX_TOKENS,
} from "./config";
import { roughTokenCount, takeLastApproxTokens } from "./token-utils";
import type { ChildChunkDraft, ParentChunkDraft, TextBlock } from "./types";

export function createParentChunks(title: string, rawBlocks: TextBlock[]): ParentChunkDraft[] {
    const blocks = attachHeadingPaths(normalizeBlocks(rawBlocks));
    const parents: ParentChunkDraft[] = [];

    let currentBlocks: TextBlock[] = [];
    let currentTokens = 0;

    for (const block of blocks) {
        const blockTokens = roughTokenCount(block.text);
        const startsNewSection = block.type === "heading" && currentTokens >= 180;
        const wouldExceedMax = currentTokens + blockTokens > PARENT_MAX_TOKENS;

        if ((startsNewSection || wouldExceedMax) && currentBlocks.length > 0) {
            parents.push(parentFromBlocks(title, currentBlocks));
            currentBlocks = [];
            currentTokens = 0;
        }

        currentBlocks.push(block);
        currentTokens += blockTokens;
    }

    if (currentBlocks.length > 0) {
        parents.push(parentFromBlocks(title, currentBlocks));
    }

    return parents.filter((parent) => parent.tokenCount > 20);
}

export function createChildChunks(parent: ParentChunkDraft, summary: string | null): ChildChunkDraft[] {
    const parts = parent.content
        .split(/\n{2,}/g)
        .map((part) => part.trim())
        .filter(Boolean)
        .flatMap((part) => {
            if (roughTokenCount(part) <= CHILD_TARGET_TOKENS * 1.5) return [part];
            return splitLongText(part, CHILD_TARGET_TOKENS);
        });

    const children: ChildChunkDraft[] = [];
    let current = "";

    for (const part of parts) {
        const candidate = current ? `${current}\n\n${part}` : part;

        if (roughTokenCount(candidate) <= CHILD_TARGET_TOKENS || !current) {
            current = candidate;
            continue;
        }

        const chunkIndex = children.length;

        children.push({
            content: current,
            searchableText: createSearchableText(parent, summary, current),
            headingPath: parent.headingPath,
            pageStart: parent.pageStart,
            pageEnd: parent.pageEnd,
            chunkIndex,
            tokenCount: roughTokenCount(current),
        });

        const overlap = takeLastApproxTokens(current, CHILD_OVERLAP_TOKENS);
        current = overlap ? `${overlap}\n\n${part}` : part;
    }

    if (current.trim()) {
        const chunkIndex = children.length;

        children.push({
            content: current,
            searchableText: createSearchableText(parent, summary, current),
            headingPath: parent.headingPath,
            pageStart: parent.pageStart,
            pageEnd: parent.pageEnd,
            chunkIndex,
            tokenCount: roughTokenCount(current),
        });
    }

    return children;
}

export function createSearchableText(
    parent: ParentChunkDraft,
    summary: string | null,
    childContent: string,
): string {
    return [
        `Document: ${parent.title}`,
        parent.headingPath.length > 0 ? `Section: ${parent.headingPath.join(" > ")}` : null,
        summary ? `Summary: ${summary}` : null,
        `Content: ${childContent}`,
    ]
        .filter(Boolean)
        .join("\n");
}

function parentFromBlocks(title: string, blocks: TextBlock[]): ParentChunkDraft {
    const content = blocks.map(blockToContextText).join("\n\n").trim();

    const pages = blocks
        .map((block) => block.page)
        .filter((page): page is number => typeof page === "number");

    return {
        title,
        headingPath: getLastHeadingPath(blocks),
        content,
        pageStart: pages.length > 0 ? Math.min(...pages) : null,
        pageEnd: pages.length > 0 ? Math.max(...pages) : null,
        tokenCount: roughTokenCount(content),
    };
}

function blockToContextText(block: TextBlock): string {
    if (block.type === "heading") {
        const level = Math.min(Math.max(block.level ?? 2, 1), 6);
        return `${"#".repeat(level)} ${block.text}`;
    }

    return block.text;
}

function attachHeadingPaths(blocks: TextBlock[]): TextBlock[] {
    const stack: string[] = [];

    return blocks.map((block) => {
        if (block.type === "heading") {
            const level = Math.min(Math.max(block.level ?? 2, 1), 6);
            stack.length = Math.max(level - 1, 0);
            stack.push(block.text);

            return {
                ...block,
                headingPath: [...stack],
            };
        }

        return {
            ...block,
            headingPath: [...stack],
        };
    });
}

function getLastHeadingPath(blocks: TextBlock[]): string[] {
    for (let i = blocks.length - 1; i >= 0; i -= 1) {
        const headingPath = blocks[i].headingPath;
        if (headingPath && headingPath.length > 0) return headingPath;
    }

    return [];
}

function normalizeBlocks(blocks: TextBlock[]): TextBlock[] {
    const normalized: TextBlock[] = [];
    const seen = new Set<string>();

    for (const block of blocks) {
        const text = block.text.replace(/[ \t]+/g, " ").trim();
        if (text.length < 2) continue;

        const fingerprint = `${block.page ?? "x"}:${text.slice(0, 160)}`;
        if (seen.has(fingerprint)) continue;

        seen.add(fingerprint);

        normalized.push({
            ...block,
            text,
        });
    }

    return normalized;
}

function splitLongText(text: string, targetTokens: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const targetWords = Math.max(80, Math.floor(targetTokens * 0.75));
    const parts: string[] = [];

    for (let i = 0; i < words.length; i += targetWords) {
        parts.push(words.slice(i, i + targetWords).join(" "));
    }

    // Text without spaces (CJK, URLs, base64) survives word splitting as one
    // giant "word"; slice those parts by characters so they respect the target.
    const maxChars = targetTokens * 4;

    return parts.flatMap((part) => {
        if (part.length <= maxChars) return [part];

        const slices: string[] = [];
        for (let i = 0; i < part.length; i += maxChars) {
            slices.push(part.slice(i, i + maxChars));
        }
        return slices;
    });
}
