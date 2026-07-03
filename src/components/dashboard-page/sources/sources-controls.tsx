"use client";

import { cn } from "@/lib/tailwind-utils";
import AddIcon from "@/components/shared/icons/add-icon";
import AiSearchIcon from "@/components/shared/icons/ai-search-icon";
import SendButton from "../send-button";

interface SourcesControlsProps {
  onAddClick: () => void;
  topic: string;
  onTopicChange: (value: string) => void;
  onDiscover: () => void;
  isDiscovering: boolean;
}

/** The "Add sources" button paired with the AI source-discovery input. */
const SourcesControls = ({
  onAddClick,
  topic,
  onTopicChange,
  onDiscover,
  isDiscovering,
}: SourcesControlsProps) => {
  return (
    <div className="flex w-full gap-2">
      <button
        type="button"
        onClick={onAddClick}
        className={cn(
          "flex min-h-11 items-center justify-center gap-2 shadow-md/3 shrink-0",
          "px-3 rounded-full",
          "cursor-pointer bg-white hover:bg-zinc-100",
          "border border-zinc-200",
        )}
      >
        <div className="flex items-center justify-center p-0.5 bg-zinc-100 rounded-full">
          <AddIcon className="size-5" />
        </div>
        <span className="text-sm">Add sources</span>
      </button>

      <div
        className={cn(
          "flex min-h-11 items-center gap-2 flex-1 min-w-0",
          "rounded-3xl border border-zinc-200 bg-white shadow-md/3",
          "p-1.5 pl-3.5",
        )}
      >
        <input
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onDiscover();
            }
          }}
          placeholder="Ask AI to find sources on a topic…"
          className={cn(
            "flex-1 min-w-0 py-1.5 min-h-8",
            "bg-transparent text-sm",
            "focus:outline-0 placeholder:text-zinc-400",
          )}
        />
        <SendButton
          onClick={onDiscover}
          disabled={topic.trim().length === 0 || isDiscovering}
          busy={isDiscovering}
          label="Find sources"
        >
          <AiSearchIcon className="size-5 text-white" />
        </SendButton>
      </div>
    </div>
  );
};

export default SourcesControls;
