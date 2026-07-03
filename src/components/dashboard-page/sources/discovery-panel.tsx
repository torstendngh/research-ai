"use client";

import { cn } from "@/lib/tailwind-utils";
import AddIcon from "@/components/shared/icons/add-icon";
import AiSearchIcon from "@/components/shared/icons/ai-search-icon";
import IconButton from "@/components/shared/icon-button";
import { Button } from "@/components/shared/button";
import type { DiscoveredSource } from "@/lib/rag/discover";
import SourceFavicon from "./source-favicon";
import { hostnameOf } from "./source-utils";

/**
 * AI-found source suggestions, shown above the topic input until dismissed.
 * Adding a suggestion hands it to the normal URL ingestion flow, so progress
 * appears as a pending row in the list like any other source.
 */
const DiscoveryPanel = ({
  topic,
  results,
  addedUrls,
  onAdd,
  onAddAll,
  onDismiss,
  className,
}: {
  topic: string;
  results: DiscoveredSource[];
  addedUrls: Set<string>;
  onAdd: (source: DiscoveredSource) => void;
  onAddAll: () => void;
  onDismiss: () => void;
  className?: string;
}) => {
  const allAdded = results.every((result) => addedUrls.has(result.url));

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md/3",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2">
        <AiSearchIcon className="size-4 shrink-0 text-zinc-400" />
        <p className="min-w-0 flex-1 truncate text-sm text-zinc-700" title={topic}>
          Suggested sources for “{topic}”
        </p>
        {results.length > 1 && (
          <Button variant="ghost" size="xs" onClick={onAddAll} disabled={allAdded}>
            Add all
          </Button>
        )}
        <IconButton label="Dismiss suggestions" onClick={onDismiss}>
          <AddIcon className="size-4 rotate-45" />
        </IconButton>
      </div>

      <ul className="flex max-h-64 flex-col overflow-y-auto py-1">
        {results.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-zinc-400">
            Nothing suitable found — try a more specific topic.
          </li>
        )}
        {results.map((result) => {
          const added = addedUrls.has(result.url);
          return (
            <li key={result.url} className="flex items-center gap-3 px-3 py-2">
              <div className="flex size-5 shrink-0 items-center justify-center text-zinc-400">
                <SourceFavicon url={result.url} className="size-5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  title={result.url}
                  className="truncate text-sm hover:underline underline-offset-2"
                >
                  {result.title}
                </a>
                <span
                  className="truncate text-xs text-zinc-400"
                  title={result.reason}
                >
                  {hostnameOf(result.url)}
                  {result.reason ? ` · ${result.reason}` : ""}
                </span>
              </div>
              <Button
                variant="outline"
                size="xs"
                className="shrink-0"
                disabled={added}
                onClick={() => onAdd(result)}
              >
                {added ? "Added" : "Add"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DiscoveryPanel;
