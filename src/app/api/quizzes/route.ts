import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/supabase/auth";
import { generateQuizDeck } from "@/lib/rag/quiz";
import { QUIZ_DECK_SELECT, type QuizDeck } from "@/lib/quizzes";
import { checkQuota, recordUsage } from "@/lib/usage";

/**
 * POST /api/quizzes
 *
 * Generates a quiz card deck for `{ projectId, prompt }`, persists the row,
 * and responds with the deck. Slow enough (retrieval + one long completion)
 * that it lives in a route handler instead of a server action, so it doesn't
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
            { error: "Describe what the quiz cards should cover." },
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

    const quota = await checkQuota(ownerId, "quiz_deck");
    if (!quota.ok) {
        return Response.json({ error: quota.error }, { status: 429 });
    }

    try {
        const deck = await generateQuizDeck({ ownerId, projectId, prompt });

        if (!deck) {
            return Response.json(
                {
                    error: "No relevant material found for this topic. Add sources or broaden the prompt.",
                },
                { status: 422 },
            );
        }

        const { data: row, error: insertError } = await supabaseAdmin
            .from("project_quiz_decks")
            .insert({
                project_id: projectId,
                owner_id: ownerId,
                title: deck.title,
                prompt,
                cards: deck.cards,
            })
            .select(QUIZ_DECK_SELECT)
            .single();

        if (insertError) throw insertError;

        await recordUsage(ownerId, "quiz_deck");

        return Response.json({ data: row as QuizDeck });
    } catch (error) {
        console.error("Quiz deck generation failed:", error);

        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Quiz deck generation failed.",
            },
            { status: 500 },
        );
    }
}
