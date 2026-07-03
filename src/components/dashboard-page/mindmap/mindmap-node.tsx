"use client";

import { useContext } from "react";
import { Handle, Position, type NodeProps, type NodeTypes } from "@xyflow/react";
import { cn } from "@/lib/tailwind-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shared/dropdown-menu";
import CardsIcon from "@/components/shared/icons/cards-icon";
import ChatIcon from "@/components/shared/icons/chat-icon";
import MoreVerticalIcon from "@/components/shared/icons/more-vertical-icon";
import PodcastIcon from "@/components/shared/icons/podcast-icon";
import { NodeMenuContext } from "./node-menu-context";

export type MindmapNodeData = {
  label: string;
  path: string[];
  isRoot: boolean;
  /** Whether this node has children in the full graph (collapsed or not). */
  hasChildren: boolean;
  /** Whether its children are currently shown. */
  isExpanded: boolean;
  /** Number of direct children (shown as a badge while collapsed). */
  childCount: number;
};

function MindmapNodeView({ data }: NodeProps) {
  const { label, path, isRoot, hasChildren, isExpanded, childCount } =
    data as unknown as MindmapNodeData;
  const menu = useContext(NodeMenuContext);

  return (
    <div
      className={cn(
        // `group` drives the hover reveal of the ask button; `pointer-events-auto`
        // lets the node receive hover (React Flow sets nodes to pointer-events:none).
        "group pointer-events-auto relative",
        "flex w-full items-center gap-1.5 rounded-[10px] border py-1.5 pr-1.5 pl-2.5",
        "shadow-[0_1px_2px_rgba(24,24,27,0.04)]",
        // Clicking a node with children expands/collapses it (handled by the
        // flow's onNodeClick), so hint that it's interactive.
        hasChildren && "cursor-pointer",
        isRoot
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, width: 1, height: 1, minWidth: 0, border: 0 }}
      />
      <span
        className={cn(
          "flex-1 truncate text-left text-[11px]",
          isRoot ? "font-semibold" : "font-medium",
        )}
      >
        {label}
      </span>
      {hasChildren && !isExpanded && (
        // Collapsed: a badge with the number of hidden children, floated off the
        // node's right edge — where those children would appear when expanded.
        <span
          aria-label={`${childCount} more`}
          className={cn(
            "absolute left-full top-1/2 ml-2 -translate-y-1/2",
            "flex h-5 min-w-5 items-center justify-center rounded-md border px-1",
            "text-[10px] font-semibold tabular-nums shadow-[0_1px_2px_rgba(24,24,27,0.04)]",
            isRoot
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white text-zinc-500",
          )}
        >
          {childCount}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="More"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              // Revealed on node hover (and while the menu is open); `nodrag
              // nopan` keep the click from panning.
              "nodrag nopan opacity-0 transition-opacity group-hover:opacity-100 aria-expanded:opacity-100",
              "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md",
              isRoot
                ? "text-zinc-300 hover:bg-white/10 hover:text-white aria-expanded:bg-white/10 aria-expanded:text-white"
                : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 aria-expanded:bg-zinc-100 aria-expanded:text-zinc-900",
            )}
          >
            <MoreVerticalIcon className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <DropdownMenuItem onSelect={() => menu.ask(path)}>
            <ChatIcon />
            Ask AI
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => menu.podcast(path)}>
            <PodcastIcon />
            Generate podcast
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => menu.quiz(path)}>
            <CardsIcon />
            Create quiz cards
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, width: 1, height: 1, minWidth: 0, border: 0 }}
      />
    </div>
  );
}

export const nodeTypes: NodeTypes = { mindmap: MindmapNodeView };
