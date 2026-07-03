"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/supabase/auth";
import {
    PODCAST_BUCKET,
    PODCAST_SELECT,
    withUrls,
    type Podcast,
    type PodcastRow,
} from "@/lib/podcasts";

// Episode generation lives in `POST /api/podcasts` (see the route handler) so
// its multi-minute runtime doesn't block other server actions in the tab.

export async function listPodcasts(projectId: string): Promise<Podcast[]> {
    const ownerId = await requireUserId();

    const { data, error } = await supabaseAdmin
        .from("project_podcasts")
        .select(PODCAST_SELECT)
        .eq("owner_id", ownerId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return Promise.all(((data ?? []) as PodcastRow[]).map(withUrls));
}

export async function deletePodcast(podcastId: string): Promise<void> {
    const ownerId = await requireUserId();

    const { data: row, error } = await supabaseAdmin
        .from("project_podcasts")
        .select("id, audio_path")
        .eq("id", podcastId)
        .eq("owner_id", ownerId)
        .maybeSingle();

    if (error) throw error;
    if (!row) return;

    // Best effort — an orphaned object is harmless, a dangling row is not.
    await supabaseAdmin.storage.from(PODCAST_BUCKET).remove([row.audio_path as string]);

    const { error: deleteError } = await supabaseAdmin
        .from("project_podcasts")
        .delete()
        .eq("id", podcastId)
        .eq("owner_id", ownerId);

    if (deleteError) throw deleteError;
}
