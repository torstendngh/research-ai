// Plain server module (not "use server"): only called from auth-checked server
// actions (same rationale as ask.ts).

import { ANSWER_MODEL, openai } from "./config";

export type DiscoveredSource = {
    url: string;
    title: string;
    /** One sentence on why this source is worth adding. */
    reason: string;
};

const MAX_RESULTS = 5;

const DISCOVER_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        sources: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    url: { type: "string" },
                    title: { type: "string" },
                    reason: { type: "string" },
                },
                required: ["url", "title", "reason"],
            },
        },
    },
    required: ["sources"],
};

/**
 * Web-search for 3–5 high-quality sources on a topic, suitable for ingestion
 * as project sources. `excludeUrls` (the project's existing sources) are
 * filtered out again afterwards, since the model only treats them as a hint.
 */
export async function discoverSources(
    topic: string,
    excludeUrls: string[] = [],
): Promise<DiscoveredSource[]> {
    const response = await openai.responses.create({
        model: ANSWER_MODEL,
        tools: [{ type: "web_search" }],
        instructions: [
            "You find high-quality web sources for a research topic. Search the web, then pick the 3 to 5 best pages.",
            "Prefer authoritative, substantial sources: official documentation, standards bodies, peer-reviewed papers, well-regarded publications, in-depth articles.",
            "Avoid thin listicles, SEO spam, forums, paywalled pages, and video-only pages — the pages will be ingested as text.",
            "Every url must be a real page you found via search, never invented.",
            "Give each source a one-sentence reason explaining what it contributes.",
            excludeUrls.length > 0
                ? `Do not suggest any of these URLs (already in the project):\n${excludeUrls.join("\n")}`
                : null,
        ]
            .filter(Boolean)
            .join("\n"),
        input: `Topic: ${topic}`,
        text: {
            format: {
                type: "json_schema",
                name: "discovered_sources",
                strict: true,
                schema: DISCOVER_SCHEMA,
            },
        },
        max_output_tokens: 3000,
    });

    let parsed: { sources: DiscoveredSource[] };
    try {
        parsed = JSON.parse(response.output_text) as { sources: DiscoveredSource[] };
    } catch {
        return [];
    }

    const excluded = new Set(excludeUrls.map(normalizeUrl).filter(Boolean));
    const seen = new Set<string>();
    const results: DiscoveredSource[] = [];

    for (const source of parsed.sources ?? []) {
        const normalized = normalizeUrl(source.url);
        if (!normalized || seen.has(normalized) || excluded.has(normalized)) continue;
        seen.add(normalized);

        results.push({
            url: source.url.trim(),
            title: (source.title ?? "").trim() || source.url.trim(),
            reason: (source.reason ?? "").trim(),
        });

        if (results.length >= MAX_RESULTS) break;
    }

    return results;
}

/** Canonical form for dedupe/exclusion: host + path, no scheme/query/hash. */
function normalizeUrl(raw: string): string | null {
    try {
        const url = new URL(raw.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;
        const path = url.pathname.replace(/\/+$/, "");
        return `${url.hostname.replace(/^www\./, "")}${path}`.toLowerCase();
    } catch {
        return null;
    }
}
