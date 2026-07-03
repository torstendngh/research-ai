"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/supabase/auth";
import {
    DEFAULT_RESPONSE_LENGTH,
    isResponseLength,
    type ResponseLength,
} from "@/lib/settings";

/** A generated key topic shown on the overview page. */
export type ProjectTopic = {
    label: string;
    summary: string;
};

export type Project = {
    id: string;
    title: string;
    description: string | null;
    topics: ProjectTopic[];
    response_length: ResponseLength;
    created_at: string;
    updated_at: string;
};

const PROJECT_SELECT =
    "id, title, description, topics, response_length, created_at, updated_at";

export async function listProjects(): Promise<Project[]> {
    const ownerId = await requireUserId();

    const { data, error } = await supabaseAdmin
        .from("projects")
        .select(PROJECT_SELECT)
        .eq("owner_id", ownerId)
        .order("updated_at", { ascending: false });

    if (error) throw error;

    return (data ?? []) as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
    const ownerId = await requireUserId();

    const { data, error } = await supabaseAdmin
        .from("projects")
        .select(PROJECT_SELECT)
        .eq("id", id)
        .eq("owner_id", ownerId)
        .maybeSingle();

    if (error) throw error;

    return (data as Project) ?? null;
}

export async function createProject(title?: string): Promise<Project> {
    const ownerId = await requireUserId();

    const trimmed = title?.trim();

    const { data, error } = await supabaseAdmin
        .from("projects")
        .insert({
            owner_id: ownerId,
            title: trimmed && trimmed.length > 0 ? trimmed : "Untitled project",
        })
        .select(PROJECT_SELECT)
        .single();

    if (error) throw error;

    revalidatePath("/dashboard");

    return data as Project;
}

export async function renameProject(id: string, title: string): Promise<void> {
    const ownerId = await requireUserId();

    const trimmed = title.trim();

    const { error } = await supabaseAdmin
        .from("projects")
        .update({ title: trimmed.length > 0 ? trimmed : "Untitled project", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("owner_id", ownerId);

    if (error) throw error;

    revalidatePath(`/dashboard/${id}`);
}

export async function setProjectResponseLength(
    id: string,
    responseLength: ResponseLength,
): Promise<void> {
    const ownerId = await requireUserId();

    const value = isResponseLength(responseLength)
        ? responseLength
        : DEFAULT_RESPONSE_LENGTH;

    const { error } = await supabaseAdmin
        .from("projects")
        .update({ response_length: value, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("owner_id", ownerId);

    if (error) throw error;

    revalidatePath(`/dashboard/${id}`);
}

export type ProjectUsage = {
    sourceCount: number;
    /** Parent chunks — the sections the answer model reads. */
    sectionCount: number;
    /** Child chunks — the embedded units search runs over. */
    chunkCount: number;
    /** Rough size of the stored text (tokens ≈ 4 bytes each). */
    estimatedTextBytes: number;
};

export async function getProjectUsage(projectId: string): Promise<ProjectUsage> {
    const ownerId = await requireUserId();

    const { data: sources, error: sourcesError } = await supabaseAdmin
        .from("rag_sources")
        .select("id")
        .eq("owner_id", ownerId)
        .eq("project_id", projectId);

    if (sourcesError) throw sourcesError;

    const sourceIds = (sources ?? []).map((source) => source.id as string);

    if (sourceIds.length === 0) {
        return { sourceCount: 0, sectionCount: 0, chunkCount: 0, estimatedTextBytes: 0 };
    }

    const { data: parents, error: parentsError } = await supabaseAdmin
        .from("rag_parent_chunks")
        .select("token_count")
        .in("source_id", sourceIds);

    if (parentsError) throw parentsError;

    const { count: chunkCount, error: chunksError } = await supabaseAdmin
        .from("rag_child_chunks")
        .select("id", { count: "exact", head: true })
        .in("source_id", sourceIds);

    if (chunksError) throw chunksError;

    const tokens = (parents ?? []).reduce(
        (sum, row) => sum + ((row.token_count as number) ?? 0),
        0,
    );

    return {
        sourceCount: sourceIds.length,
        sectionCount: (parents ?? []).length,
        chunkCount: chunkCount ?? 0,
        estimatedTextBytes: tokens * 4,
    };
}

export async function deleteProject(id: string): Promise<void> {
    const ownerId = await requireUserId();

    // Podcast audio lives in storage, which the DB cascade can't reach —
    // remove the files before the `project_podcasts` rows cascade away.
    const { data: podcastRows, error: podcastsError } = await supabaseAdmin
        .from("project_podcasts")
        .select("audio_path")
        .eq("project_id", id)
        .eq("owner_id", ownerId);

    if (podcastsError) throw podcastsError;

    const audioPaths = (podcastRows ?? [])
        .map((row) => row.audio_path as string)
        .filter(Boolean);

    if (audioPaths.length > 0) {
        // Best effort — an orphaned object is harmless.
        for (let i = 0; i < audioPaths.length; i += 100) {
            await supabaseAdmin.storage.from("podcasts").remove(audioPaths.slice(i, i + 100));
        }
    }

    const { error } = await supabaseAdmin
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("owner_id", ownerId);

    if (error) throw error;

    revalidatePath("/dashboard");
}
