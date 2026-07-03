import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/supabase/auth";
import { askQuestionStream } from "@/lib/rag";
import type { ChatTurn, RagCitation } from "@/lib/rag";
import { isResponseLength } from "@/lib/settings";
import { checkQuota, recordUsage } from "@/lib/usage";

/**
 * POST /api/chats/:chatId/messages
 *
 * Generates (and persists) an assistant reply, streamed as newline-delimited
 * JSON events:
 *
 *   { "type": "citations", "citations": [...] }   retrieval done, before text
 *   { "type": "delta",     "text": "..." }        one piece of the answer
 *   { "type": "done",      "message": {...} }     the persisted ChatMessage
 *   { "type": "error",     "error": "..." }       terminal failure
 *
 * With a `content` body field the user message is inserted first; without one,
 * the latest pending user message is answered (the dashboard-created first
 * turn). This lives in a route handler instead of a server action because
 * server actions cannot stream their response.
 */

const MESSAGE_SELECT = "id, chat_id, role, content, citations, created_at";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ chatId: string }> },
): Promise<Response> {
    const { chatId } = await params;

    const ownerId = await getCurrentUserId();
    if (!ownerId) {
        return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    const { data: chat, error: chatError } = await supabaseAdmin
        .from("chats")
        .select("id, project_id")
        .eq("id", chatId)
        .eq("owner_id", ownerId)
        .maybeSingle();

    if (chatError) {
        return Response.json({ error: chatError.message }, { status: 500 });
    }
    if (!chat) {
        return Response.json({ error: "Chat not found." }, { status: 404 });
    }

    // Enforced before the user message is persisted, so a blocked turn leaves
    // no half-finished conversation behind.
    const quota = await checkQuota(ownerId, "chat_message");
    if (!quota.ok) {
        return Response.json({ error: quota.error }, { status: 429 });
    }

    if (content) {
        const { error: insertError } = await supabaseAdmin
            .from("chat_messages")
            .insert({ chat_id: chatId, role: "user", content });

        if (insertError) {
            return Response.json({ error: insertError.message }, { status: 500 });
        }
    }

    // The question is the most recent user message; everything before it is
    // conversation history for follow-up resolution.
    const { data: messageRows, error: messagesError } = await supabaseAdmin
        .from("chat_messages")
        .select("role, content")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

    if (messagesError) {
        return Response.json({ error: messagesError.message }, { status: 500 });
    }

    const turns = (messageRows ?? []) as ChatTurn[];
    const questionIndex = turns.findLastIndex((turn) => turn.role === "user");

    if (questionIndex === -1) {
        return Response.json({ error: "No question to answer." }, { status: 400 });
    }

    const question = turns[questionIndex].content;
    const history = turns.slice(0, questionIndex);

    // Restrict retrieval to the project's ready, enabled sources.
    const { data: sources, error: sourcesError } = await supabaseAdmin
        .from("rag_sources")
        .select("id")
        .eq("owner_id", ownerId)
        .eq("project_id", chat.project_id)
        .eq("status", "ready")
        .eq("enabled", true);

    if (sourcesError) {
        return Response.json({ error: sourcesError.message }, { status: 500 });
    }

    const sourceIds = (sources ?? []).map((source) => source.id as string);

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const send = (event: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
            };

            try {
                let answer = "";
                let citations: RagCitation[] = [];

                if (sourceIds.length === 0) {
                    answer =
                        "This project has no sources yet. Add a PDF or URL on the project page so I can answer from your material.";
                    send({ type: "delta", text: answer });
                } else {
                    // Answer shaping is non-fatal: if the per-account custom
                    // instructions or the project's response-length preset
                    // can't be read, just answer with defaults.
                    const { data: settings } = await supabaseAdmin
                        .from("user_settings")
                        .select("instructions")
                        .eq("owner_id", ownerId)
                        .maybeSingle();

                    const { data: projectSettings } = await supabaseAdmin
                        .from("projects")
                        .select("response_length")
                        .eq("id", chat.project_id)
                        .eq("owner_id", ownerId)
                        .maybeSingle();

                    // Counted per generated reply (the canned "no sources"
                    // answer above costs nothing and stays free).
                    await recordUsage(ownerId, "chat_message");

                    const result = await askQuestionStream({
                        question,
                        ownerId,
                        sourceIds,
                        history,
                        instructions: (settings?.instructions as string) ?? "",
                        responseLength: isResponseLength(projectSettings?.response_length)
                            ? projectSettings.response_length
                            : undefined,
                    });

                    citations = result.citations;
                    send({ type: "citations", citations });

                    for await (const delta of result.stream) {
                        answer += delta;
                        send({ type: "delta", text: delta });
                    }

                    answer = answer.trim();
                }

                const { data: assistant, error: assistantError } = await supabaseAdmin
                    .from("chat_messages")
                    .insert({
                        chat_id: chatId,
                        role: "assistant",
                        content: answer,
                        citations: citations.length > 0 ? citations : null,
                    })
                    .select(MESSAGE_SELECT)
                    .single();

                if (assistantError) throw assistantError;

                await supabaseAdmin
                    .from("chats")
                    .update({ updated_at: new Date().toISOString() })
                    .eq("id", chatId);

                send({ type: "done", message: assistant });
            } catch (error) {
                console.error("Chat streaming failed:", error);
                send({
                    type: "error",
                    error: error instanceof Error ? error.message : "Failed to generate an answer.",
                });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "content-type": "application/x-ndjson; charset=utf-8",
            "cache-control": "no-store",
        },
    });
}
