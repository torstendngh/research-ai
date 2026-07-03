import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

import { blocksFromMarkdown, blocksFromPlainText } from "./blocks";
import { sha256 } from "./crypto-utils";
import type { ExtractedSource, IngestPdfInput, IngestTextInput, IngestUrlInput } from "./types";

export async function extractPdfSource(input: IngestPdfInput): Promise<ExtractedSource> {
    const buffer = Buffer.isBuffer(input.fileBuffer)
        ? input.fileBuffer
        : Buffer.from(
            input.fileBuffer instanceof Uint8Array
                ? input.fileBuffer
                : new Uint8Array(input.fileBuffer),
        );

    // unpdf wraps a serverless build of pdfjs with no native deps: pdf-parse's
    // pdfjs stack needed @napi-rs/canvas's native binary to define DOMMatrix,
    // which Vercel's function bundler didn't ship, so it crashed at load on
    // deploy. Imported lazily so pdfjs only loads when a PDF is actually
    // ingested — chat and URL/text ingestion never touch it.
    const { extractText } = await import("unpdf");
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: false });

    const blocks = text.flatMap((pageText, index) =>
        blocksFromPlainText(pageText, index + 1),
    );

    return {
        sourceType: "pdf",
        title: input.fileName.replace(/\.pdf$/i, ""),
        fileName: input.fileName,
        contentHash: sha256(buffer),
        blocks,
    };
}

export function extractTextSource(input: IngestTextInput): ExtractedSource {
    // Pasted text is treated as markdown so headings/lists users paste in
    // keep their structure; plain prose falls through as paragraphs anyway.
    const blocks = blocksFromMarkdown(input.text);

    return {
        sourceType: "text",
        title: input.title,
        contentHash: sha256(`${input.title}\n${input.text}`),
        blocks,
    };
}

export async function extractUrlSource(input: IngestUrlInput): Promise<ExtractedSource> {
    const response = await fetch(input.url, {
        headers: {
            "user-agent": "Mozilla/5.0 RAGBot/1.0",
            "accept": "text/html,application/xhtml+xml",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch URL. Status: ${response.status}`);
    }

    const html = await response.text();

    // linkedom instead of jsdom: a lightweight, pure-JS DOM that bundles and
    // runs cleanly on serverless. jsdom's transitive deps pulled in an ESM-only
    // module that a CJS require() couldn't load on Vercel's Node runtime, which
    // crashed the whole rag module graph. Imported lazily so it only loads when
    // a URL is actually ingested — chat and PDF/text ingestion never touch it.
    const { parseHTML } = await import("linkedom");
    const { document } = parseHTML(html);

    const canonicalUrl =
        document.querySelector("link[rel='canonical']")?.getAttribute("href") ??
        input.url;

    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
        throw new Error("Could not extract readable content from URL.");
    }

    const turndown = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
    });

    const markdown = turndown.turndown(article.content ?? article.textContent ?? "");
    const blocks = blocksFromMarkdown(markdown);

    return {
        sourceType: "url",
        title: article.title || new URL(input.url).hostname,
        url: input.url,
        canonicalUrl,
        contentHash: sha256(`${canonicalUrl}\n${markdown}`),
        blocks,
    };
}
