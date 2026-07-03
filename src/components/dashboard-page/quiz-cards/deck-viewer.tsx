"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/tailwind-utils";
import IconButton from "@/components/shared/icon-button";
import AddIcon from "@/components/shared/icons/add-icon";
import CheckIcon from "@/components/shared/icons/check-icon";
import ChevronLeftIcon from "@/components/shared/icons/chevron-left-icon";
import CloseIcon from "@/components/shared/icons/close-icon";
import RegenerateIcon from "@/components/shared/icons/regenerate-icon";
import type { QuizDeck } from "@/lib/quizzes";

/**
 * Full-tab study session for one deck: a flip card (question front, answer back)
 * that you self-grade "got it" / "missed". A running score tracks the round and
 * a summary at the end offers a restart or a focused retry of the missed cards.
 * Mount with `key={deck.id}` so the whole session resets when the deck changes.
 */
const DeckViewer = ({ deck, onClose }: { deck: QuizDeck; onClose: () => void }) => {
  // `order` is the list of card indices for the current round — the full deck to
  // start, or just the missed cards on a retry. `results` maps a card index to
  // whether it was answered correctly this round.
  const [order, setOrder] = useState<number[]>(() =>
    deck.cards.map((_, index) => index),
  );
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);

  const cardIndex = order[pos];
  const card = deck.cards[cardIndex];

  const correctCount = Object.values(results).filter(Boolean).length;
  const missedIndices = order.filter((index) => results[index] === false);

  const startRound = (indices: number[]) => {
    setOrder(indices);
    setPos(0);
    setFlipped(false);
    setResults({});
    setFinished(false);
  };

  const grade = (correct: boolean) => {
    setResults((prev) => ({ ...prev, [cardIndex]: correct }));
    if (pos >= order.length - 1) {
      setFinished(true);
      return;
    }
    setFlipped(false);
    setPos((prev) => prev + 1);
  };

  const goBack = () => {
    if (pos === 0) return;
    setFlipped(false);
    setPos((prev) => prev - 1);
  };

  // Space/Enter flips the card; ArrowLeft steps back to re-grade a card.
  useEffect(() => {
    if (finished) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        goBack();
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        // Don't hijack keys aimed at a button (e.g. the grade or close buttons).
        if (event.target instanceof HTMLElement && event.target !== document.body) return;
        event.preventDefault();
        setFlipped((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, order.length, finished]);

  if (finished) {
    const total = order.length;
    const percent = total === 0 ? 0 : Math.round((correctCount / total) * 100);
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-zinc-800" title={deck.title}>
              {deck.title}
            </span>
            <span className="truncate text-xs text-zinc-400">Session complete</span>
          </div>
          <div className="ml-auto shrink-0">
            <IconButton label="Close deck" side="left" onClick={onClose}>
              <AddIcon className="size-5 rotate-45" />
            </IconButton>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Your score
            </span>
            <span className="text-5xl font-semibold tabular-nums text-zinc-900">
              {correctCount}
              <span className="text-zinc-300"> / {total}</span>
            </span>
            <span className="text-sm text-zinc-500">{percent}% correct</span>
          </div>

          <div className="flex w-full max-w-xs items-center gap-4 text-sm">
            <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 py-2 text-zinc-700">
              <CheckIcon className="size-4 text-emerald-600" />
              {correctCount} correct
            </span>
            <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 py-2 text-zinc-700">
              <CloseIcon className="size-4 text-red-500" />
              {missedIndices.length} missed
            </span>
          </div>

          <div className="flex flex-col items-stretch gap-2 pt-2">
            <button
              type="button"
              onClick={() => startRound(deck.cards.map((_, index) => index))}
              className={cn(
                "flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium",
                "bg-zinc-900 text-white",
                "cursor-pointer transition-colors hover:bg-zinc-700 active:bg-zinc-600",
              )}
            >
              <RegenerateIcon className="size-4" />
              Study again
            </button>
            {missedIndices.length > 0 && (
              <button
                type="button"
                onClick={() => startRound(missedIndices)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium",
                  "border-zinc-200 bg-white text-zinc-700",
                  "cursor-pointer transition-colors hover:border-zinc-900 hover:bg-zinc-100",
                )}
              >
                Retry {missedIndices.length} missed
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header: deck title + progress + close */}
      <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-zinc-800" title={deck.title}>
            {deck.title}
          </span>
          <span className="truncate text-xs text-zinc-400">
            Card {pos + 1} of {order.length} · Score {correctCount}
          </span>
        </div>
        <div className="ml-auto shrink-0">
          <IconButton label="Close deck" side="left" onClick={onClose}>
            <AddIcon className="size-5 rotate-45" />
          </IconButton>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-zinc-100">
        <div
          className="h-full bg-zinc-900 transition-[width] duration-300"
          style={{ width: `${(pos / order.length) * 100}%` }}
        />
      </div>

      {/* The card */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
        <button
          type="button"
          onClick={() => setFlipped((prev) => !prev)}
          aria-label={flipped ? "Show question" : "Show answer"}
          className="w-full max-w-xl cursor-pointer [perspective:1200px] focus:outline-0"
        >
          <div
            className={cn(
              "relative grid min-h-72 w-full",
              "transition-transform duration-500 [transform-style:preserve-3d]",
              flipped && "[transform:rotateY(180deg)]",
            )}
          >
            {/* Front: question */}
            <div
              className={cn(
                "col-start-1 row-start-1 flex flex-col items-center justify-center gap-4 p-8",
                "rounded-3xl border border-zinc-200 bg-white shadow-md/3",
                "[backface-visibility:hidden]",
              )}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Question
              </span>
              <p className="text-center text-lg text-zinc-800">{card.question}</p>
              <span className="text-xs text-zinc-400">Click to reveal the answer</span>
            </div>

            {/* Back: answer */}
            <div
              className={cn(
                "col-start-1 row-start-1 flex flex-col items-center justify-center gap-4 p-8",
                "rounded-3xl border border-zinc-900 bg-zinc-900 text-white shadow-md/3",
                "[backface-visibility:hidden] [transform:rotateY(180deg)]",
              )}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Answer
              </span>
              <p className="text-center text-lg">{card.answer}</p>
              <span className="text-xs text-zinc-400">How did you do?</span>
            </div>
          </div>
        </button>
      </div>

      {/* Footer: back + grade / reveal */}
      <div className="flex items-center gap-3 border-t border-zinc-200 px-4 py-3">
        <button
          type="button"
          onClick={goBack}
          disabled={pos === 0}
          aria-label="Previous card"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border",
            "border-zinc-200 bg-white text-zinc-600",
            "cursor-pointer transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          <ChevronLeftIcon className="size-4" />
        </button>

        {flipped ? (
          <div className="flex flex-1 items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => grade(false)}
              className={cn(
                "flex flex-1 max-w-40 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium",
                "border-red-200 bg-white text-red-600",
                "cursor-pointer transition-colors hover:border-red-500 hover:bg-red-50",
              )}
            >
              <CloseIcon className="size-4" />
              Missed
            </button>
            <button
              type="button"
              onClick={() => grade(true)}
              className={cn(
                "flex flex-1 max-w-40 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium",
                "border-emerald-600 bg-emerald-600 text-white",
                "cursor-pointer transition-colors hover:bg-emerald-500 active:bg-emerald-700",
              )}
            >
              <CheckIcon className="size-4" />
              Got it
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className={cn(
              "flex flex-1 max-w-xs items-center justify-center self-center rounded-full px-4 py-2 text-sm font-medium",
              "bg-zinc-900 text-white",
              "cursor-pointer transition-colors hover:bg-zinc-700 active:bg-zinc-600",
              "mx-auto",
            )}
          >
            Reveal answer
          </button>
        )}

        {/* Spacer to balance the back button so the middle stays centered. */}
        <div className="size-9 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
};

export default DeckViewer;
