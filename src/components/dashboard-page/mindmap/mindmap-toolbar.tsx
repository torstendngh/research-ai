"use client";

import { useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/tailwind-utils";
import IconButton from "@/components/shared/icon-button";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import RegenerateIcon from "@/components/shared/icons/regenerate-icon";
import ZoomFitIcon from "@/components/shared/icons/zoom-fit-icon";
import ZoomInIcon from "@/components/shared/icons/zoom-in-icon";
import ZoomOutIcon from "@/components/shared/icons/zoom-out-icon";

/** Floating zoom/fit controls plus the regenerate action, top-right of the canvas. */
const MindmapToolbar = ({
  onRegenerate,
  disabled,
  isUpdating,
}: {
  onRegenerate: () => void;
  disabled: boolean;
  isUpdating: boolean;
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="nodrag nopan absolute right-4 top-4 z-20 flex items-center gap-0.5 rounded-xl border border-zinc-200 bg-white p-1 shadow-md/3">
      <IconButton label="Zoom out" onClick={() => zoomOut({ duration: 160 })}>
        <ZoomOutIcon className="size-5" />
      </IconButton>
      <IconButton label="Zoom in" onClick={() => zoomIn({ duration: 160 })}>
        <ZoomInIcon className="size-5" />
      </IconButton>
      <IconButton label="Fit view" onClick={() => fitView({ padding: 0.2, duration: 200 })}>
        <ZoomFitIcon className="size-5" />
      </IconButton>
      <div className="mx-1 h-5 w-px bg-zinc-200" />
      <button
        type="button"
        onClick={onRegenerate}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 rounded-md p-1 pr-2 text-sm font-medium text-zinc-400",
          "cursor-pointer hover:bg-zinc-100 hover:text-zinc-700",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        {isUpdating ? (
          <LoadingIcon className="size-5 animate-spin" />
        ) : (
          <RegenerateIcon className="size-5" />
        )}
        {isUpdating ? "Generating" : "Regenerate"}
      </button>
    </div>
  );
};

export default MindmapToolbar;
