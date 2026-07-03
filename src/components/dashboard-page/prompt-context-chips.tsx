"use client";

import { cn } from "@/lib/tailwind-utils";
import CloseIcon from "@/components/shared/icons/close-icon";
import type { PromptContextChip } from "./dashboard-context";

interface PromptContextChipsProps {
  chips: PromptContextChip[];
  onRemove: (id: string) => void;
  className?: string;
}

const PromptContextChips = ({
  chips,
  onRemove,
  className,
}: PromptContextChipsProps) => {
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={cn(
            "group/chip flex max-w-full items-center gap-1.5 rounded-full",
            "border border-zinc-200 bg-zinc-50 px-2.5 py-1",
            "text-xs text-zinc-700",
          )}
        >
          <span className="truncate">{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.id)}
            aria-label={`Remove ${chip.label}`}
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-full",
              "cursor-pointer text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700",
            )}
          >
            <CloseIcon className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
};

export default PromptContextChips;
