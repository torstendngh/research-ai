"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/tailwind-utils";
import IconButton from "@/components/shared/icon-button";
import CloseIcon from "@/components/shared/icons/close-icon";
import InstructionsIcon from "@/components/shared/icons/instructions-icon";
import SourcesIcon from "@/components/shared/icons/sources-icon";
import UploadIcon from "@/components/shared/icons/upload-icon";
import SourceFavicon from "./source-favicon";
import {
  stagedSubtitle,
  stagedTitle,
  stagedWarning,
  type StagedSource,
} from "./staged-source";

interface StagedSourceListProps {
  staged: StagedSource[];
  onRemove: (id: string) => void;
  /** Clicking a staged text item reopens it in the text form for editing. */
  onEditText: (item: StagedSource) => void;
}

/** The staged batch — the body of the add-source dialog. */
const StagedSourceList = ({ staged, onRemove, onEditText }: StagedSourceListProps) => {
  if (staged.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div
          className={cn(
            "flex size-11 items-center justify-center",
            "rounded-full bg-zinc-100 text-zinc-400",
          )}
        >
          <UploadIcon className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-600">
            Drop PDFs anywhere to add them
          </p>
          <p className="max-w-64 text-xs text-balance text-zinc-400">
            Or upload files, paste a link or text, or ask AI to find sources —
            everything gathers here until you confirm.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      <AnimatePresence initial={false}>
        {staged.map((item) => {
          const warning = stagedWarning(item);
          const content = (
            <>
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
                  className={cn(
                    "truncate text-sm text-zinc-800",
                    item.kind === "text" &&
                      "group-hover/edit:underline underline-offset-2",
                  )}
                  title={stagedTitle(item)}
                >
                  {stagedTitle(item)}
                </span>
                <span className="truncate text-xs text-zinc-400">
                  {stagedSubtitle(item)}
                  {warning && (
                    <span
                      className={
                        warning.tone === "error"
                          ? "text-red-600"
                          : "text-amber-600"
                      }
                    >
                      {" · "}
                      {warning.text}
                    </span>
                  )}
                </span>
              </div>
            </>
          );
          return (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className={cn(
                "group flex shrink-0 items-center gap-2.5 rounded-lg px-2 py-1.5",
                "hover:bg-zinc-50",
              )}
            >
              {item.kind === "text" ? (
                <button
                  type="button"
                  onClick={() => onEditText(item)}
                  title="Edit text"
                  className={cn(
                    "group/edit flex min-w-0 flex-1 items-center gap-2.5",
                    "cursor-pointer text-left",
                  )}
                >
                  {content}
                </button>
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  {content}
                </div>
              )}
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
          );
        })}
      </AnimatePresence>
    </ul>
  );
};

export default StagedSourceList;
