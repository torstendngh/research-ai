"use client";

import InstructionsIcon from "@/components/shared/icons/instructions-icon";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import SourcesIcon from "@/components/shared/icons/sources-icon";
import { Switch } from "@/components/shared/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shared/tooltip";
import type { Source } from "@/lib/actions/sources";
import RemoveButton from "./remove-button";
import SourceFavicon from "./source-favicon";
import SourceRow from "./source-row";
import { sourceSubtitle } from "./source-utils";

interface SourceListItemProps {
  source: Source;
  /** Optimistic on/off value (server value with any pending override applied). */
  enabled: boolean;
  deleting: boolean;
  onToggleEnabled: (next: boolean) => void;
  onDelete: () => void;
}

/** A single row in the sources list: status icon, title, and enable/remove actions. */
const SourceListItem = ({
  source,
  enabled,
  deleting,
  onToggleEnabled,
  onDelete,
}: SourceListItemProps) => {
  const subtitle = sourceSubtitle(source);
  const isProcessing =
    source.status !== null &&
    source.status !== "ready" &&
    source.status !== "failed";
  const isReady = source.status === "ready";

  return (
    <SourceRow
      dimmed={isReady && !enabled}
      icon={
        isProcessing ? (
          <LoadingIcon className="size-5 animate-spin" />
        ) : source.source_type === "url" ? (
          <SourceFavicon url={source.url} className="size-5" />
        ) : source.source_type === "text" ? (
          <InstructionsIcon className="size-5" />
        ) : (
          <SourcesIcon className="size-5" />
        )
      }
      title={source.title || source.file_name || source.url || "Untitled"}
      titleHref={source.source_type === "url" ? source.url : null}
      subtitle={subtitle.text}
      subtitleTone={subtitle.tone}
      subtitleTitle={subtitle.tone === "error" ? subtitle.text : undefined}
      action={
        <>
          {isReady && (
            <Tooltip>
              {/* The Switch is wrapped so the tooltip trigger's own
                  data-state lands on the span, not on the switch —
                  otherwise it clobbers data-[state=checked] and the
                  track loses its background. */}
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Switch
                    size="sm"
                    checked={enabled}
                    onCheckedChange={onToggleEnabled}
                    aria-label={enabled ? "Turn source off" : "Turn source on"}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">
                {enabled
                  ? "Used by this project's tools"
                  : "Ignored by this project's tools"}
              </TooltipContent>
            </Tooltip>
          )}
          <RemoveButton
            onClick={onDelete}
            busy={deleting}
            label="Remove source"
          />
        </>
      }
    />
  );
};

export default SourceListItem;
