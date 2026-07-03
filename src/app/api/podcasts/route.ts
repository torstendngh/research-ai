import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/supabase/auth";
import { generatePodcastEpisode } from "@/lib/rag/podcast";
import {
    PODCAST_BUCKET,
    PODCAST_SELECT,
    withUrls,
    type PodcastRow,
} from "@/lib/podcasts";
import { checkQuota, checkStorage, recordUsage } from "@/lib/usage";

/**
 * POST /api/podcasts
 *
 * Generates a full episode (script + audio) for `{ projectId, prompt }`,
 * stores the MP3 in the private bucket, persists the row, and responds with
 * the podcast (including signed playback/download URLs). Slow (a couple of
 * minutes): the caller keeps a pending entry in client state meanwhile.
 *
 * A route handler instead of a server action so the long generation doesn't
 * block other server actions in the tab (Next.js runs actions serially).
 */
export async function POST(request: Request): Promise<Response> {
    const ownerId = await getCurrentUserId();
    if (!ownerId) {
        return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const projectId = typeof body?.projectId === "string" ? body.projectId : "";
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!projectId) {
        return Response.json({ error: "Missing project." }, { status: 400 });
    }
    if (!prompt) {
        return Response.json(
            { error: "Describe what the episode should cover." },
            { status: 400 },
        );
    }

    const { data: project, error: projectError } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("owner_id", ownerId)
        .maybeSingle();

    if (projectError) {
        return Response.json({ error: projectError.message }, { status: 500 });
    }
    if (!project) {
        return Response.json({ error: "Project not found." }, { status: 404 });
    }

    const quota = await checkQuota(ownerId, "podcast");
    if (!quota.ok) {
        return Response.json({ error: quota.error }, { status: 429 });
    }

    // Audio size is unknown up front (~1 MB/min); just require headroom.
    const storage = await checkStorage(ownerId);
    if (!storage.ok) {
        return Response.json({ error: storage.error }, { status: 429 });
    }

    try {
        const episode = await generatePodcastEpisode({ ownerId, projectId, prompt });

        if (!episode) {
            return Response.json(
                {
                    error: "No relevant material found for this topic. Add sources or broaden the prompt.",
                },
                { status: 422 },
            );
        }

        const audioPath = `${ownerId}/${projectId}/${randomUUID()}.mp3`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from(PODCAST_BUCKET)
            .upload(audioPath, episode.audio, { contentType: "audio/mpeg" });

        if (uploadError) throw uploadError;

        const { data: row, error: insertError } = await supabaseAdmin
            .from("project_podcasts")
            .insert({
                project_id: projectId,
                owner_id: ownerId,
                title: episode.title,
                prompt,
                script: episode.segments,
                audio_path: audioPath,
                duration_seconds: episode.durationSeconds,
                audio_bytes: episode.audio.byteLength,
            })
            .select(PODCAST_SELECT)
            .single();

        if (insertError) throw insertError;

        await recordUsage(ownerId, "podcast");

        return Response.json({ data: await withUrls(row as PodcastRow) });
    } catch (error) {
        console.error("Podcast generation failed:", error);

        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Podcast generation failed.",
            },
            { status: 500 },
        );
    }
}
