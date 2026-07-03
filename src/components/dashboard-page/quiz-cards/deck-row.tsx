"use client";

import { cn } from "@/lib/tailwind-utils";
import IconButton from "@/components/shared/icon-button";
import CardsIcon from "@/components/shared/icons/cards-icon";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import TrashIcon from "@/components/shared/icons/trash-icon";
import type { QuizDeck } from "@/lib/quizzes";

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** One deck in the list: study button, title/meta, delete action. */
const DeckRow = ({
  deck,
  onStudy,
  onDelete,
  deleting,
}: {
  deck: QuizDeck;
  onStudy: () => void;
  onDelete: () => void;
  deleting: boolean;
}) => (
  <li
    className={cn(
      "group flex items-center gap-3 overflow-hidden p-2 rounded-md",
      "hover:bg-zinc-100",
    )}
  
      onClick={onStudy}
  >
    <div
      
      aria-label="Study deck"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border",
        "cursor-pointer transition-colors",
        "border-zinc-200 bg-white text-zinc-600",
      )}
    >
      <CardsIcon className="size-4" />
    </div>

    <div
      className="flex min-w-0 flex-col items-start justify-center overflow-hidden cursor-pointer text-left"
    >
      <span className="w-full truncate text-sm" title={deck.title}>
        {deck.title}
      </span>
      <span
        className="w-full truncate text-xs text-zinc-400"
        title={deck.prompt}
      >
        {deck.cards.length} cards · {dateLabel(deck.created_at)}
      </span>
    </div>

    <div className="ml-auto flex shrink-0 items-center gap-1">
      <IconButton
        label="Delete deck"
        onClick={onDelete}
        disabled={deleting}
        className={cn(
          "hover:bg-zinc-200",
          deleting ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        {deleting ? (
          <LoadingIcon className="size-4 animate-spin" />
        ) : (
          <TrashIcon className="size-4" />
        )}
      </IconButton>
    </div>
  </li>
);

export default DeckRow;
