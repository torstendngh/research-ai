import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { PDFParse } from "pdf-parse";

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

    // pdf-parse v2 reconstructs logical lines itself (lineEnforce defaults to
    // true), so each page's text already comes back newline-separated.
    const parser = new PDFParse({ data: buffer });

    let parsed;
    try {
        parsed = await parser.getText();
    } finally {
        await parser.destroy();
    }

    const blocks = parsed.pages.flatMap((page) => blocksFromPlainText(page.text, page.num));

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
    const dom = new JSDOM(html, { url: input.url });
    const document = dom.window.document;

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
