import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/supabase/auth";
import { syncProjectMindmap } from "@/lib/mindmap-sync";

/**
 * POST /api/projects/:projectId/mindmap
 *
 * Returns the project's mind map, (re)generating it when the ready sources
 * changed since the last generation — or always, with `{ "force": true }`.
 *
 * A route handler instead of a server action so the LLM-backed generation
 * doesn't block other server actions in the tab (Next.js runs actions
 * serially).
 */
export async function POST(
    request: Request,
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

    const body = await request.json().catch(() => ({}));
    const force = body?.force === true;

    try {
        const state = await syncProjectMindmap(projectId, ownerId, { force });

        return Response.json({ data: state });
    } catch (error) {
        console.error("Mind map sync failed:", error);

        return Response.json(
            {
                error:
                    error instanceof Error ? error.message : "Mind map sync failed.",
            },
            { status: 500 },
        );
    }
}
