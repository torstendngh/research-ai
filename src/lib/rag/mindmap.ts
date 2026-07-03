import { ANSWER_MODEL, openai } from "./config";
import { EMPTY_MINDMAP, type MindmapGraph } from "@/lib/mindmap";

export type MindmapSourceInput = {
    title: string;
    points: string[];
};

const MINDMAP_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        title: { type: "string" },
        nodes: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                    parentId: { type: ["string", "null"] },
                },
                required: ["id", "label", "parentId"],
            },
        },
    },
    required: ["title", "nodes"],
};

// Parent-chunk summaries arrive as one blob per chunk (up to ~4 bullets each,
// see summarizeParentChunk). Splitting them into individual bullets gives the
// mind-map model many more atomic facts to branch into, instead of one dense
// point per section — the difference between a 3-level tree and a real one.
function flattenPoints(rawPoints: string[]): string[] {
    return rawPoints
        .flatMap((point) => point.split(/\r?\n/))
        .map((line) => line.replace(/^[\s]*[-*•]\s*|^\s*\d+[.)]\s*/, "").trim())
        .filter((line) => line.length > 0);
}

export async function generateMindmapGraph(
    sources: MindmapSourceInput[],
): Promise<MindmapGraph> {
    if (sources.length === 0) return EMPTY_MINDMAP;

    const sourceBlocks = sources
        .map((source, index) => {
            const bullets = flattenPoints(source.points).slice(0, 30);
            const points = bullets.map((point) => `  - ${point}`).join("\n");
            return `Source ${index + 1}: ${source.title}\n${points}`.trim();
        })
        .join("\n\n");

    const response = await openai.responses.create({
        model: ANSWER_MODEL,
        instructions: [
            "You build a detailed hierarchical mind map that summarizes a set of research sources.",
            "Return a tree of nodes: exactly one root node has parentId null; every other node's parentId references another node's id.",
            "The root captures the overall theme across all sources.",
            "Build at least 4 levels of depth where the material supports it: root -> main themes -> topics -> specific details (names, dates, numbers, definitions, decisions).",
            "Don't stop at topic labels — push facts down into their own leaf nodes instead of leaving a topic as a dead end.",
            "Group related ideas across sources instead of mirroring the source or section list one-to-one.",
            "Every non-leaf node should usually have 2 or more children; avoid long single-child chains.",
            "Keep labels short — at most 6 words, no trailing punctuation. Use as many nodes as the material supports, between 25 and 80.",
            "Use short unique ids like 'n1', 'n2'.",
        ].join("\n"),
        input: `Sources and their key points:\n\n${sourceBlocks}`,
        text: {
            format: {
                type: "json_schema",
                name: "mindmap",
                strict: true,
                schema: MINDMAP_SCHEMA,
            },
        },
        max_output_tokens: 6000,
    });

    let parsed: MindmapGraph;
    try {
        parsed = JSON.parse(response.output_text) as MindmapGraph;
    } catch {
        return EMPTY_MINDMAP;
    }

    return normalizeGraph(parsed);
}

/**
 * Defends the renderer against malformed model output: dedupes ids, trims
 * labels, and rewrites parent references that point at missing nodes to null
 * (so they render as additional roots rather than dangling edges).
 */
function normalizeGraph(graph: MindmapGraph): MindmapGraph {
    const seen = new Set<string>();
    const nodes = (graph.nodes ?? [])
        .filter((node) => node && typeof node.id === "string" && node.id.length > 0)
        .filter((node) => {
            if (seen.has(node.id)) return false;
            seen.add(node.id);
            return true;
        })
        .map((node) => ({
            id: node.id,
            label: (node.label ?? "").trim().slice(0, 80) || "Untitled",
            parentId: typeof node.parentId === "string" ? node.parentId : null,
        }));

    const ids = new Set(nodes.map((node) => node.id));
    for (const node of nodes) {
        if (node.parentId && (!ids.has(node.parentId) || node.parentId === node.id)) {
            node.parentId = null;
        }
    }

    return { title: (graph.title ?? "").trim(), nodes };
}
