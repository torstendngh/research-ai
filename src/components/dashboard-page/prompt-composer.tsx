"use client";

import { ReactNode, RefObject } from "react";
import { cn } from "@/lib/tailwind-utils";
import ArrowUpIcon from "@/components/shared/icons/arrow-up-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shared/tooltip";
import PromptContextChips from "./prompt-context-chips";
import SendButton from "./send-button";
import type { PromptContextChip } from "./dashboard-context";

interface PromptComposerProps {
  /** Clickable prompt starters shown above the input. */
  suggestions: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  chips: PromptContextChip[];
  onRemoveChip: (id: string) => void;
  placeholder: string;
  /** Optional note under the suggestions (e.g. "add sources first"). */
  hint?: ReactNode;
  error?: string | null;
  canSubmit: boolean;
  /** Whether a generation is in flight — swaps the send icon for a spinner. */
  submitting: boolean;
  onSubmit: () => void;
  sendLabel: string;
  sendTooltip: string;
  /** Owned by the parent so it can focus the input from elsewhere. */
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

/**
 * The shared "describe what you want, then generate" input used by the podcast
 * and quiz tabs: a row of suggestion chips, an optional hint/error, and a card
 * holding the context chips, a growing textarea, and a send button.
 */
const PromptComposer = ({
  suggestions,
  draft,
  onDraftChange,
  chips,
  onRemoveChip,
  placeholder,
  hint,
  error,
  canSubmit,
  submitting,
  onSubmit,
  sendLabel,
  sendTooltip,
  textareaRef,
}: PromptComposerProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <>
      {/* Prompt card + suggestions */}
      <div className="flex flex-col gap-3 p-4 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                onDraftChange(suggestion);
                textareaRef.current?.focus();
              }}
              className={cn(
                "max-w-full truncate rounded-full border border-zinc-200 px-3 py-1",
                "text-xs text-zinc-600",
                "cursor-pointer hover:bg-zinc-100",
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {hint && <p className="text-xs text-zinc-400">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div
        className={cn(
          "flex flex-col gap-1.5",
          "rounded-3xl border border-zinc-200 bg-white shadow-md/3",
          "p-1.5 pl-3.5 m-4 mt-0",
        )}
      >
        <PromptContextChips
          chips={chips}
          onRemove={onRemoveChip}
          className="pr-10 pt-1"
        />
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "field-sizing-content resize-none",
              "flex-1 min-w-0 self-center py-1.5",
              "min-h-8 max-h-40",
              "bg-transparent text-sm",
              "focus:outline-0 placeholder:text-zinc-400",
            )}
          ></textarea>
          <Tooltip>
            <TooltipTrigger asChild>
              <SendButton
                onClick={onSubmit}
                disabled={!canSubmit}
                busy={submitting}
                label={sendLabel}
              >
                <ArrowUpIcon className="size-5" />
              </SendButton>
            </TooltipTrigger>
            <TooltipContent side="top">{sendTooltip}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
};

export default PromptComposer;
