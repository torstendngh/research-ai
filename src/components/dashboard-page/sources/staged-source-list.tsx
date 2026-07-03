"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/tailwind-utils";
import IconButton from "@/components/shared/icon-button";
import CloseIcon from "@/components/shared/icons/close-icon";
import InstructionsIcon from "@/components/shared/icons/instructions-icon";
import SourcesIcon from "@/components/shared/icons/sources-icon";
import SourceFavicon from "./source-favicon";
import { stagedSubtitle, stagedTitle, type StagedSource } from "./staged-source";

interface StagedSourceListProps {
  staged: StagedSource[];
  onRemove: (id: string) => void;
}

/** The "Ready to add" queue of staged sources inside the add-source dialog. */
const StagedSourceList = ({ staged, onRemove }: StagedSourceListProps) => {
  return (
    <AnimatePresence initial={false}>
      {staged.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex flex-col overflow-hidden"
        >
          <p className="px-1 pb-1.5 pt-1 text-xs font-medium text-zinc-400">
            Ready to add · {staged.length}
          </p>
          <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
            <AnimatePresence initial={false}>
              {staged.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2 py-1.5",
                    "hover:bg-zinc-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center",
                      "rounded-md bg-zinc-100 text-zinc-500",
                    )}
                  >
                    {item.kind === "url" ? (
                      <SourceFavicon url={item.url} className="size-4.5" />
                    ) : item.kind === "pdf" ? (
                      <SourcesIcon className="size-4.5" />
                    ) : (
                      <InstructionsIcon className="size-4.5" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className="truncate text-sm text-zinc-800"
                      title={stagedTitle(item)}
                    >
                      {stagedTitle(item)}
                    </span>
                    <span className="truncate text-xs text-zinc-400">
                      {stagedSubtitle(item)}
                    </span>
                  </div>
                  <IconButton
                    label="Remove from list"
                    onClick={() => onRemove(item.id)}
                    className={cn(
                      "shrink-0 hover:bg-zinc-200",
                      "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                    )}
                  >
                    <CloseIcon className="size-4" />
                  </IconButton>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StagedSourceList;
