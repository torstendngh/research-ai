import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/supabase/auth";
import { discoverSources } from "@/lib/rag/discover";

/**
 * POST /api/sources/discover
 *
 * Asks the model to web-search 3–5 high-quality sources for `{ topic }`.
 * With a `projectId`, the project's existing source URLs are excluded so
 * suggestions are always new.
 *
 * A route handler instead of a server action so the web-search round trip
 * doesn't block other server actions in the tab (Next.js runs actions
 * serially).
 */
export async function POST(request: Request): Promise<Response> {
    const ownerId = await getCurrentUserId();
    if (!ownerId) {
        return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const topic = typeof body?.topic === "string" ? body.topic.trim() : "";
    const projectId = typeof body?.projectId === "string" ? body.projectId : null;

    if (!topic) {
        return Response.json(
            { error: "Describe a topic to search for." },
            { status: 400 },
        );
    }

    try {
        let excludeUrls: string[] = [];

        if (projectId) {
            const { data: project, error: projectError } = await supabaseAdmin
                .from("projects")
                .select("id")
                .eq("id", projectId)
                .eq("owner_id", ownerId)
                .maybeSingle();

            if (projectError) throw projectError;
            if (!project) {
                return Response.json({ error: "Project not found." }, { status: 404 });
            }

            const { data: existing, error: existingError } = await supabaseAdmin
                .from("rag_sources")
                .select("url")
                .eq("owner_id", ownerId)
                .eq("project_id", projectId)
                .not("url", "is", null);

            if (existingError) throw existingError;

            excludeUrls = (existing ?? [])
                .map((row) => row.url as string)
                .filter(Boolean);
        }

        const results = await discoverSources(topic, excludeUrls);

        return Response.json({ data: results });
    } catch (error) {
        console.error("Source discovery failed:", error);

        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Source discovery failed.",
            },
            { status: 500 },
        );
    }
}
