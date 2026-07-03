// Shared podcast shapes + row helpers, used by both the server actions
// (list/delete) and the generation route handler.

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PodcastSegment } from "@/lib/rag/podcast";

export type Podcast = {
    id: string;
    project_id: string;
    title: string;
    prompt: string;
    script: PodcastSegment[];
    duration_seconds: number;
    created_at: string;
    /** Short-lived signed URL into the private `podcasts` bucket (playback). */
    audioUrl: string | null;
    /** Same object, but with a content-disposition that forces a download. */
    downloadUrl: string | null;
};

export const PODCAST_BUCKET = "podcasts";
export const PODCAST_SELECT =
    "id, project_id, title, prompt, script, audio_path, duration_seconds, created_at";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type PodcastRow = {
    id: string;
    project_id: string;
    title: string;
    prompt: string;
    script: PodcastSegment[];
    audio_path: string;
    duration_seconds: number;
    created_at: string;
};

function downloadNameFor(title: string): string {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `${slug || "podcast"}.mp3`;
}

export async function withUrls(row: PodcastRow): Promise<Podcast> {
    const storage = supabaseAdmin.storage.from(PODCAST_BUCKET);

    const [{ data: audio }, { data: download }] = await Promise.all([
        storage.createSignedUrl(row.audio_path, SIGNED_URL_TTL_SECONDS),
        storage.createSignedUrl(row.audio_path, SIGNED_URL_TTL_SECONDS, {
            download: downloadNameFor(row.title),
        }),
    ]);

    return {
        id: row.id,
        project_id: row.project_id,
        title: row.title,
        prompt: row.prompt,
        script: row.script ?? [],
        duration_seconds: row.duration_seconds,
        created_at: row.created_at,
        audioUrl: audio?.signedUrl ?? null,
        downloadUrl: download?.signedUrl ?? null,
    };
}
