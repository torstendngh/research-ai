// Shared quiz deck shapes, used by both the server actions (list/delete) and
// the generation route handler.

import type { QuizCard } from "@/lib/rag/quiz";

export type QuizDeck = {
    id: string;
    project_id: string;
    title: string;
    prompt: string;
    cards: QuizCard[];
    created_at: string;
};

export const QUIZ_DECK_SELECT =
    "id, project_id, title, prompt, cards, created_at";
