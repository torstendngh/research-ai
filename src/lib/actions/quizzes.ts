"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/supabase/auth";
import { QUIZ_DECK_SELECT, type QuizDeck } from "@/lib/quizzes";

// Deck generation lives in `POST /api/quizzes` (see the route handler) so its
// runtime doesn't block other server actions in the tab.

export async function listQuizDecks(projectId: string): Promise<QuizDeck[]> {
    const ownerId = await requireUserId();

    const { data, error } = await supabaseAdmin
        .from("project_quiz_decks")
        .select(QUIZ_DECK_SELECT)
        .eq("owner_id", ownerId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []) as QuizDeck[];
}

export async function deleteQuizDeck(deckId: string): Promise<void> {
    const ownerId = await requireUserId();

    const { error } = await supabaseAdmin
        .from("project_quiz_decks")
        .delete()
        .eq("id", deckId)
        .eq("owner_id", ownerId);

    if (error) throw error;
}
