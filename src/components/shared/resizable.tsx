"use client";

import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/tailwind-utils";

// react-resizable-panels defaults the group to `overflow: hidden` and each
// panel's content box to `overflow: auto`, to keep resizing from flashing
// unclipped content. Our panel content (`Window`) already clips and scrolls
// itself, so that default just cuts off box-shadows at the panel edges —
// override both to `visible` (still overridable per-usage via `style`).
function ResizablePanelGroup({
  className,
  style,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className,
      )}
      style={{ overflow: "visible", ...style }}
      {...props}
    />
  );
}

function ResizablePanel({ style, ...props }: ResizablePrimitive.PanelProps) {
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      style={{ overflow: "visible", ...style }}
      {...props}
    />
  );
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "group relative flex w-2 items-center justify-center shrink-0",
        "cursor-col-resize focus-visible:outline-hidden",
        "aria-[orientation=horizontal]:h-2 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "h-10 w-1 shrink-0 rounded-full bg-transparent transition-colors",
          "group-hover:bg-zinc-300 group-active:bg-zinc-400",
          "group-aria-[orientation=horizontal]:h-1 group-aria-[orientation=horizontal]:w-10",
        )}
      />
      {withHandle && (
        <div className="z-10 flex h-6 w-1 shrink-0 rounded-lg bg-border" />
      )}
    </ResizablePrimitive.Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
