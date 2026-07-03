import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/supabase/auth";
import { regenerateProjectMeta } from "@/lib/project-meta";

/**
 * POST /api/projects/:projectId/meta
 *
 * Regenerates the project's title, description, and topics from its sources.
 * Batch source uploads call this once after all ingests settle (each ingest
 * is sent with `skipProjectMeta`) so the meta generation runs a single time
 * per batch instead of once per source.
 */
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ projectId: string }> },
): Promise<Response> {
    const { projectId } = await params;

    const ownerId = await getCurrentUserId();
    if (!ownerId) {
        return Response.json({ error: "Not authenticated." }, { status: 401 });
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

    await regenerateProjectMeta(projectId, ownerId);

    revalidatePath(`/dashboard/${projectId}`);

    return Response.json({ data: { ok: true } });
}
