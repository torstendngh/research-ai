"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/supabase/auth";
import type { SourceType } from "@/lib/rag/types";

export type Source = {
    id: string;
    title: string;
    url: string | null;
    file_name: string | null;
    source_type: SourceType;
    status: string | null;
    error_message: string | null;
    /** When false, the project's tools skip this source during retrieval. */
    enabled: boolean;
    created_at: string;
};

// Source discovery lives in `POST /api/sources/discover` (see the route
// handler) so the web-search round trip doesn't block other server actions.

export async function listSources(projectId: string): Promise<Source[]> {
    const ownerId = await requireUserId();

    const { data, error } = await supabaseAdmin
        .from("rag_sources")
        .select("id, title, url, file_name, source_type, status, error_message, enabled, created_at")
        .eq("owner_id", ownerId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []) as Source[];
}

export async function setSourceEnabled(id: string, enabled: boolean): Promise<void> {
    const ownerId = await requireUserId();

    const { error } = await supabaseAdmin
        .from("rag_sources")
        .update({ enabled })
        .eq("id", id)
        .eq("owner_id", ownerId);

    if (error) throw error;
}

export async function deleteSource(id: string): Promise<void> {
    const ownerId = await requireUserId();

    const { error } = await supabaseAdmin
        .from("rag_sources")
        .delete()
        .eq("id", id)
        .eq("owner_id", ownerId);

    if (error) throw error;
}
