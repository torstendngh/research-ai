// Server-side mind-map sync: (re)generates a project's mind map from its
// sources when they changed. Called from the mindmap route handler.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateMindmapGraph } from "@/lib/rag/mindmap";
import { EMPTY_MINDMAP, type MindmapGraph } from "@/lib/mindmap";

export type MindmapState = {
    graph: MindmapGraph;
    updatedAt: string | null;
    sourceCount: number;
};

type ReadySource = { id: string; title: string };

async function listReadySources(
    projectId: string,
    ownerId: string,
): Promise<ReadySource[]> {
    const { data, error } = await supabaseAdmin
        .from("rag_sources")
        .select("id, title")
        .eq("owner_id", ownerId)
        .eq("project_id", projectId)
        .eq("status", "ready")
        .eq("enabled", true)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []) as ReadySource[];
}

// The mind map is regenerated only when this changes, so it stays stable as long
// as the project's ready sources do.
function signatureOf(sourceIds: string[]): string {
    return sourceIds.slice().sort().join(",");
}

async function persist(
    projectId: string,
    ownerId: string,
    graph: MindmapGraph,
    signature: string,
): Promise<string> {
    const updatedAt = new Date().toISOString();

    const { error } = await supabaseAdmin.from("project_mindmaps").upsert(
        {
            project_id: projectId,
            owner_id: ownerId,
            title: graph.title,
            graph,
            signature,
            updated_at: updatedAt,
        },
        { onConflict: "project_id" },
    );

    if (error) throw error;

    return updatedAt;
}

/**
 * Return the project's mind map, (re)generating it from the current sources when
 * they have changed since the last generation (or when `force` is set). The
 * caller is responsible for authenticating `ownerId` and checking that the
 * project belongs to them.
 */
export async function syncProjectMindmap(
    projectId: string,
    ownerId: string,
    options?: { force?: boolean },
): Promise<MindmapState> {
    const sources = await listReadySources(projectId, ownerId);
    const signature = signatureOf(sources.map((source) => source.id));

    const { data: existing } = await supabaseAdmin
        .from("project_mindmaps")
        .select("graph, signature, updated_at")
        .eq("project_id", projectId)
        .maybeSingle();

    const cachedGraph = existing?.graph as MindmapGraph | undefined;

    // Up to date: return the cached graph without spending an OpenAI call.
    if (
        !options?.force &&
        existing &&
        existing.signature === signature &&
        cachedGraph
    ) {
        return {
            graph: cachedGraph,
            updatedAt: existing.updated_at as string,
            sourceCount: sources.length,
        };
    }

    if (sources.length === 0) {
        const updatedAt = await persist(projectId, ownerId, EMPTY_MINDMAP, signature);
        return { graph: EMPTY_MINDMAP, updatedAt, sourceCount: 0 };
    }

    // Build per-source key points from parent-chunk summaries (falling back to
    // chunk headings when a source has no summaries yet).
    const sourceIds = sources.map((source) => source.id);
    const { data: parents } = await supabaseAdmin
        .from("rag_parent_chunks")
        .select("source_id, summary, title")
        .in("source_id", sourceIds);

    const pointsBySource = new Map<string, string[]>();
    for (const row of (parents ?? []) as {
        source_id: string;
        summary: string | null;
        title: string;
    }[]) {
        const points = pointsBySource.get(row.source_id) ?? [];
        const text = (row.summary ?? "").trim() || (row.title ?? "").trim();
        if (text && !points.includes(text)) points.push(text);
        pointsBySource.set(row.source_id, points);
    }

    // Capped per source so a project with many sources still fits the prompt;
    // generateMindmapGraph flattens each summary into individual bullets, so
    // this cap is on sections, not on the facts the mind map can ultimately use.
    const input = sources.map((source) => ({
        title: source.title,
        points: (pointsBySource.get(source.id) ?? []).slice(0, 12),
    }));

    const graph = await generateMindmapGraph(input);
    const updatedAt = await persist(projectId, ownerId, graph, signature);

    return { graph, updatedAt, sourceCount: sources.length };
}
