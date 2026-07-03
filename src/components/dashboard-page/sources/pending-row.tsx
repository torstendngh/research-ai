"use client";

import LoadingIcon from "@/components/shared/icons/loading-icon";
import { useDashboard, type PendingSource } from "../dashboard-context";
import RemoveButton from "./remove-button";
import SourceFavicon from "./source-favicon";
import SourceRow from "./source-row";

/** A source that is still being ingested (or failed to); see `PendingSource`. */
const PendingRow = ({ pending }: { pending: PendingSource }) => {
  const { dismissPendingSource } = useDashboard();
  const failed = pending.status === "failed";

  return (
    <SourceRow
      icon={
        failed ? (
          <SourceFavicon url={pending.kind === "url" ? pending.title : null} className="size-5" />
        ) : (
          <LoadingIcon className="size-5 animate-spin" />
        )
      }
      title={pending.title}
      subtitle={failed ? pending.error ?? "Failed to process" : "Processing…"}
      subtitleTone={failed ? "error" : "muted"}
      subtitleTitle={failed ? pending.error : undefined}
      action={
        failed ? (
          <RemoveButton onClick={() => dismissPendingSource(pending.id)} label="Dismiss" />
        ) : null
      }
    />
  );
};

export default PendingRow;
