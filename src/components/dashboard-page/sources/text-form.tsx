"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/tailwind-utils";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { Textarea } from "@/components/shared/textarea";
import InstructionsIcon from "@/components/shared/icons/instructions-icon";

interface TextFormProps {
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  body: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
}

/** Collapsible "write or paste text" form for the add-source dialog. */
const TextForm = ({
  isOpen,
  onToggle,
  title,
  body,
  onTitleChange,
  onBodyChange,
  onSubmit,
}: TextFormProps) => {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border transition-colors",
        isOpen
          ? "border-zinc-200"
          : "border-zinc-200 hover:border-zinc-300",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-3 py-2.5",
          "cursor-pointer select-none text-sm",
          isOpen ? "text-zinc-700" : "text-zinc-500 hover:text-zinc-700",
        )}
      >
        <InstructionsIcon className="size-4.5 shrink-0 text-zinc-400" />
        Write or paste text
        <span className="ml-auto text-xs text-zinc-400">
          {isOpen ? "Hide" : "Show"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 border-t border-zinc-100 p-3">
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
              />
              <Textarea
                placeholder="Paste or write your text here…"
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                className="max-h-36"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSubmit}
                  disabled={body.trim().length === 0}
                >
                  Add to list
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TextForm;
