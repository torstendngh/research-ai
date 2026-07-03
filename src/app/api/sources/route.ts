import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/supabase/auth";
import { ingestSource } from "@/lib/rag";
import type { IngestSourceResult } from "@/lib/rag";
import { regenerateProjectMeta } from "@/lib/project-meta";
import { checkQuota, checkStorage, recordUsage } from "@/lib/usage";

/**
 * POST /api/sources
 *
 * Ingests a source into a project and responds with the ingest result.
 * Accepts JSON (`{ projectId, url }` for web sources, `{ projectId, title,
 * text }` for pasted text) or `multipart/form-data` (`projectId` + `file`)
 * for PDFs. `skipProjectMeta` (JSON boolean / form field "true") suppresses
 * the per-source project meta regeneration — batch uploads pass it and
 * regenerate once at the end via `POST /api/projects/:id/meta`.
 *
 * This lives in a route handler instead of a server action on purpose:
 * ingestion takes tens of seconds, and Next.js runs server actions serially
 * per tab — as a server action it blocked every other action (settings,
 * renames, chat setup) until the upload finished.
 */

type IngestJob =
    | { type: "url"; url: string }
    | { type: "pdf"; fileName: string; fileBuffer: Buffer }
    | { type: "text"; title: string; text: string };

async function parseRequest(
    request: Request,
): Promise<
    | { projectId: string; job: IngestJob; skipProjectMeta: boolean }
    | { error: string }
> {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const projectId = String(formData.get("projectId") ?? "");
        const file = formData.get("file");
        const skipProjectMeta = formData.get("skipProjectMeta") === "true";

        if (!projectId) return { error: "Missing project." };
        if (!(file instanceof File)) return { error: "Missing PDF file." };
        if (
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {
            return { error: "Only PDF files are supported." };
        }

        const arrayBuffer = await file.arrayBuffer();

        return {
            projectId,
            skipProjectMeta,
            job: {
                type: "pdf",
                fileName: file.name,
                fileBuffer: Buffer.from(arrayBuffer),
            },
        };
    }

    const body = await request.json().catch(() => ({}));
    const projectId = typeof body?.projectId === "string" ? body.projectId : "";
    const skipProjectMeta = body?.skipProjectMeta === true;

    if (!projectId) return { error: "Missing project." };

    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (text) {
        const title =
            typeof body?.title === "string" && body.title.trim()
                ? body.title.trim()
                : "Pasted text";
        return { projectId, skipProjectMeta, job: { type: "text", title, text } };
    }

    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) return { error: "Missing URL or text." };

    try {
        new URL(url);
    } catch {
        return { error: "Invalid URL." };
    }

    return { projectId, skipProjectMeta, job: { type: "url", url } };
}

export async function POST(request: Request): Promise<Response> {
    const ownerId = await getCurrentUserId();
    if (!ownerId) {
        return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const parsed = await parseRequest(request);
    if ("error" in parsed) {
        return Response.json({ error: parsed.error }, { status: 400 });
    }

    const { projectId, job, skipProjectMeta } = parsed;

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

    const quota = await checkQuota(ownerId, "source_ingest");
    if (!quota.ok) {
        return Response.json({ error: quota.error }, { status: 429 });
    }

    // For URLs the extracted text size is unknown up front; require headroom.
    const storage = await checkStorage(
        ownerId,
        job.type === "pdf" ? job.fileBuffer.byteLength : undefined,
    );
    if (!storage.ok) {
        return Response.json({ error: storage.error }, { status: 429 });
    }

    try {
        const data: IngestSourceResult = await ingestSource(
            job.type === "pdf"
                ? {
                      type: "pdf",
                      fileName: job.fileName,
                      fileBuffer: job.fileBuffer,
                      ownerId,
                      projectId,
                      generateSummaries: true,
                  }
                : job.type === "text"
                  ? {
                        type: "text",
                        title: job.title,
                        text: job.text,
                        ownerId,
                        projectId,
                        generateSummaries: true,
                    }
                  : {
                        type: "url",
                        url: job.url,
                        ownerId,
                        projectId,
                        generateSummaries: true,
                    },
        );

        if (!data.reusedExisting) await recordUsage(ownerId, "source_ingest");

        if (!skipProjectMeta) await regenerateProjectMeta(projectId, ownerId);

        revalidatePath(`/dashboard/${projectId}`);

        return Response.json({ data });
    } catch (error) {
        console.error("Source ingestion failed:", error);

        return Response.json(
            {
                error:
                    error instanceof Error ? error.message : "Ingestion failed.",
            },
            { status: 500 },
        );
    }
}
