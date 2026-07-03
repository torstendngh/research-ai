"use client";

import { useMemo, useState } from "react";
import CardsIcon from "@/components/shared/icons/cards-icon";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { deleteQuizDeck, listQuizDecks } from "@/lib/actions/quizzes";
import type { QuizDeck } from "@/lib/quizzes";
import { useDashboard } from "../dashboard-context";
import PromptComposer from "../prompt-composer";
import { buildQuizPrompt } from "../prompt-context-format";
import { useGeneratedList } from "../use-generated-list";
import DeckRow from "./deck-row";
import DeckViewer from "./deck-viewer";

const QuizCards = () => {
  const { project, sources, quizPrompt } = useDashboard();
  const projectId = project?.id ?? null;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QuizDeck | null>(null);

  const hasReadySources = sources.some((source) => source.status === "ready");

  const {
    items: decks,
    generatingHere,
    errorHere,
    deletingIds,
    isGenerating,
    canGenerate,
    generate,
    deleteItem,
    textareaRef,
  } = useGeneratedList<QuizDeck>({
    projectId,
    hasReadySources,
    apiPath: "/api/quizzes",
    load: listQuizDecks,
    remove: deleteQuizDeck,
    buildPrompt: buildQuizPrompt,
    prompt: quizPrompt,
  });

  const suggestions = useMemo(() => {
    const sourceTitles = sources
      .filter((source) => source.status === "ready")
      .map(
        (source) =>
          source.title || source.file_name || source.url || "Untitled",
      )
      .slice(0, 3);
    return [
      "Key terms and definitions across all my sources",
      ...sourceTitles.map((title) => `Quiz me on “${title}”`),
      "Names, dates, and numbers worth memorizing",
    ];
  }, [sources]);

  const handleDelete = (id: string) =>
    deleteItem(id, () => {
      if (activeId === id) setActiveId(null);
    });

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-zinc-400">
        Select a project to create quiz cards.
      </div>
    );
  }

  const activeDeck = decks?.find((deck) => deck.id === activeId) ?? null;
  const isEmpty = decks !== null && decks.length === 0 && !generatingHere;

  // Studying a deck takes over the whole tab; closing returns to the list.
  if (activeDeck) {
    return (
      <DeckViewer
        key={activeDeck.id}
        deck={activeDeck}
        onClose={() => setActiveId(null)}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex w-full max-w-3xl mx-auto flex-1 flex-col overflow-hidden">
        {/* Deck list */}
        <ul className="flex flex-1 flex-col overflow-y-auto p-2">
          {generatingHere && (
            <li className="flex items-center gap-3 overflow-hidden px-4 py-2">
              <div className="flex size-9 shrink-0 items-center justify-center text-zinc-400">
                <LoadingIcon className="size-5 animate-spin" />
              </div>
              <div className="flex min-w-0 flex-col items-start justify-center overflow-hidden">
                <span
                  className="w-full truncate text-sm"
                  title={generatingHere.prompt}
                >
                  {generatingHere.prompt}
                </span>
                <span className="w-full truncate text-xs text-zinc-400">
                  Generating deck — this can take a moment…
                </span>
              </div>
            </li>
          )}

          {decks === null && !generatingHere && (
            <li className="flex justify-center py-8">
              <LoadingIcon className="size-5 animate-spin text-zinc-400" />
            </li>
          )}

          {isEmpty && (
            <li className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <CardsIcon className="size-6 text-zinc-300" />
              <p className="text-sm text-zinc-400">
                No decks yet. Describe a topic above to create your first set
                of quiz cards.
              </p>
            </li>
          )}

          {(decks ?? []).map((deck) => (
            <DeckRow
              key={deck.id}
              deck={deck}
              onStudy={() => setActiveId(deck.id)}
              onDelete={() => setPendingDelete(deck)}
              deleting={deletingIds.has(deck.id)}
            />
          ))}
        </ul>

        <PromptComposer
          suggestions={suggestions}
          draft={quizPrompt.draft}
          onDraftChange={quizPrompt.setDraft}
          chips={quizPrompt.chips}
          onRemoveChip={quizPrompt.removeChip}
          placeholder={
            quizPrompt.chips.length > 0
              ? "Add deck instructions..."
              : "What should the quiz cards cover?"
          }
          hint={
            !hasReadySources
              ? "Add sources to this project first — quiz cards are generated from your source material."
              : undefined
          }
          error={errorHere}
          canSubmit={canGenerate}
          submitting={isGenerating}
          onSubmit={generate}
          sendLabel="Create quiz cards"
          sendTooltip="Create a deck of quiz cards"
          textareaRef={textareaRef}
        />
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) return handleDelete(pendingDelete.id);
        }}
        title="Delete deck?"
        description={
          <>
            <span className="font-medium text-zinc-700">
              {pendingDelete?.title}
            </span>{" "}
            and its {pendingDelete?.cards.length} cards will be permanently
            deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete deck"
      />
    </div>
  );
};

export default QuizCards;
