"use client";

import { cn } from "@/lib/tailwind-utils";
import AddIcon from "@/components/shared/icons/add-icon";
import AiSearchIcon from "@/components/shared/icons/ai-search-icon";
import SendButton from "../send-button";

/**
 * Detects "this is a link, not a topic": a single token that parses as a URL
 * with a dotted hostname (protocol optional — "example.com/article" counts).
 */
export function looksLikeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(candidate).hostname.includes(".");
  } catch {
    return false;
  }
}

interface SourceInputProps {
  value: string;
  isBusy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * The one text input of the add-sources dialog: paste a link to stage it
 * directly, or describe a topic and AI searches the web. The send icon flips
 * between "add" and "search" to show which will happen.
 */
const SourceInput = ({ value, isBusy, onChange, onSubmit }: SourceInputProps) => {
  const isUrl = looksLikeUrl(value);

  return (
    <div
      className={cn(
        "flex min-h-11 items-center gap-2 flex-1 min-w-0",
        "rounded-3xl border border-zinc-200 bg-white shadow-md/3",
        "p-1.5 pl-3.5",
      )}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Paste a link, or ask AI to find sources…"
        className={cn(
          "flex-1 min-w-0 py-1 min-h-8",
          "bg-transparent text-sm",
          "focus:outline-0 placeholder:text-zinc-400",
        )}
      />
      <SendButton
        onClick={onSubmit}
        disabled={value.trim().length === 0 || isBusy}
        busy={isBusy}
        label={isUrl ? "Add link" : "Find sources"}
      >
        {isUrl ? (
          <AddIcon className="size-5 text-white" />
        ) : (
          <AiSearchIcon className="size-5 text-white" />
        )}
      </SendButton>
    </div>
  );
};

export default SourceInput;
