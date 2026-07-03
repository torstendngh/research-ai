"use client";

import { cn } from "@/lib/tailwind-utils";
import IconButton from "@/components/shared/icon-button";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import TrashIcon from "@/components/shared/icons/trash-icon";

/** Row action to remove/dismiss a source; revealed on row hover. */
const RemoveButton = ({
  onClick,
  busy,
  label,
}: {
  onClick: () => void;
  busy?: boolean;
  label: string;
}) => (
  <IconButton
    label={label}
    onClick={onClick}
    disabled={busy}
    className={cn(
      "ml-auto shrink-0 hover:bg-zinc-200",
      busy ? "opacity-100" : "opacity-0 group-hover:opacity-100",
    )}
  >
    {busy ? (
      <LoadingIcon className="size-4 animate-spin" />
    ) : (
      <TrashIcon className="size-4" />
    )}
  </IconButton>
);

export default RemoveButton;
