import { openai, SUMMARY_MODEL, supabase } from "@/lib/rag/config";
import type { ProjectTopic } from "@/lib/actions/projects";

type ProjectMeta = {
    title: string;
    description: string;
    topics: ProjectTopic[];
};

function parseTopics(raw: unknown): ProjectTopic[] {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const candidate = entry as Partial<ProjectTopic>;
            const label =
                typeof candidate.label === "string" ? candidate.label.trim() : "";
            const summary =
                typeof candidate.summary === "string" ? candidate.summary.trim() : "";

            if (!label) return null;

            return {
                label: label.slice(0, 60),
                summary: summary.slice(0, 300),
            };
        })
        .filter((topic): topic is ProjectTopic => topic !== null)
        .slice(0, 6);
}

function parseMeta(raw: string): ProjectMeta | null {
    const cleaned = raw
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();

    try {
        const parsed = JSON.parse(cleaned) as Partial<ProjectMeta>;
        const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
        const description =
            typeof parsed.description === "string" ? parsed.description.trim() : "";

        if (!title) return null;

        return {
            title: title.slice(0, 80),
            description: description.slice(0, 2400),
            topics: parseTopics(parsed.topics),
        };
    } catch {
        return null;
    }
}

/**
 * Build a fresh title, description, and topic list for a project from its
 * sources, then persist them. Called after a source is ingested. Best-effort:
 * callers should not let a failure here fail the ingest, so this swallows/logs
 * its own errors.
 */
export async function regenerateProjectMeta(
    projectId: string,
    ownerId: string,
): Promise<void> {
    try {
        const { data: sources, error: sourcesError } = await supabase
            .from("rag_sources")
            .select("id, title, source_type, url, file_name")
            .eq("owner_id", ownerId)
            .eq("project_id", projectId)
            .order("created_at", { ascending: true });

        if (sourcesError) throw sourcesError;
        if (!sources || sources.length === 0) return;

        const sourceIds = sources.map((s) => s.id as string);

        // A few parent-chunk summaries give the model substance beyond titles.
        const { data: summaries } = await supabase
            .from("rag_parent_chunks")
            .select("summary")
            .in("source_id", sourceIds)
            .not("summary", "is", null)
            .limit(12);

        const sourceLines = sources
            .map((s, i) => {
                const label = s.title || s.file_name || s.url || `Source ${i + 1}`;
                return `- (${s.source_type}) ${label}`;
            })
            .join("\n");

        const summaryLines = (summaries ?? [])
            .map((row) => row.summary as string)
            .filter(Boolean)
            .join("\n");

        const input = [
            "Sources in this research project:",
            sourceLines,
            summaryLines ? "\nKey points from the material:" : "",
            summaryLines,
        ]
            .filter(Boolean)
            .join("\n");

        const response = await openai.responses.create({
            model: SUMMARY_MODEL,
            instructions: [
                "You describe a research project based on its sources.",
                "Produce:",
                "1. A concise, specific title (max 6 words, no quotes).",
                "2. A substantial description of two short paragraphs (6-9",
                "sentences total, separated by a blank line). The first paragraph",
                "explains the central subject and why these sources belong",
                "together; the second walks through what the material covers and",
                "the kinds of questions it can answer. Write plainly and",
                "concretely — no marketing tone.",
                "3. The 3-6 most important topics in the material, each with a",
                "short label (2-4 words) and a 1-2 sentence summary of what the",
                "sources say about it. Order them by importance.",
                "Respond with ONLY JSON:",
                '{"title": "...", "description": "...", "topics": [{"label": "...", "summary": "..."}]}.',
            ].join("\n"),
            input,
        });

        const meta = parseMeta(response.output_text);
        if (!meta) return;

        const { error: updateError } = await supabase
            .from("projects")
            .update({
                title: meta.title,
                description: meta.description || null,
                topics: meta.topics,
                updated_at: new Date().toISOString(),
            })
            .eq("id", projectId)
            .eq("owner_id", ownerId);

        if (updateError) throw updateError;
    } catch (error) {
        console.error("Project meta regeneration failed:", error);
    }
}
