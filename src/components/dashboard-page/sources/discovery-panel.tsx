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
 * AI-found source suggestions inside the add-sources dialog. Adding a
 * suggestion stages it in the batch queue alongside PDFs, links, and text —
 * nothing processes until the whole batch is submitted.
 */
const DiscoveryPanel = ({
  topic,
  results,
  stagedUrls,
  onStage,
  onStageAll,
  onDismiss,
  className,
}: {
  topic: string;
  results: DiscoveredSource[];
  /** URLs already in the staged batch, to disable their Add buttons. */
  stagedUrls: Set<string>;
  onStage: (source: DiscoveredSource) => void;
  onStageAll: () => void;
  onDismiss: () => void;
  className?: string;
}) => {
  const allStaged = results.every((result) => stagedUrls.has(result.url));

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
        <AiSearchIcon className="size-4 shrink-0 text-zinc-400" />
        <p className="min-w-0 flex-1 truncate text-sm text-zinc-700" title={topic}>
          Suggestions for “{topic}”
        </p>
        {results.length > 1 && (
          <Button variant="ghost" size="xs" onClick={onStageAll} disabled={allStaged}>
            Add all
          </Button>
        )}
        <IconButton label="Dismiss suggestions" onClick={onDismiss}>
          <AddIcon className="size-4 rotate-45" />
        </IconButton>
      </div>

      {/* At most 5 suggestions come back, so no height cap — the tab scrolls. */}
      <ul className="flex flex-col py-1">
        {results.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-zinc-400">
            Nothing suitable found — try a more specific topic.
          </li>
        )}
        {results.map((result) => {
          const staged = stagedUrls.has(result.url);
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
                disabled={staged}
                onClick={() => onStage(result)}
              >
                {staged ? "Added" : "Add"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DiscoveryPanel;
