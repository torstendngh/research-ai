"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/tailwind-utils";
import { Button } from "@/components/shared/button";
import LinkIcon from "@/components/shared/icons/link-icon";

interface UrlFieldProps {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/** URL entry row for the add-source dialog, with inline validation error. */
const UrlField = ({ value, error, onChange, onSubmit }: UrlFieldProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-white pl-3 p-1",
          "transition-colors",
          error
            ? "border-red-300 ring-2 ring-red-50"
            : "border-zinc-200 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100",
        )}
      >
        <LinkIcon className="size-4.5 shrink-0 text-zinc-400" />
        <input
          placeholder="Paste a link — https://example.com/article"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          className={cn(
            "min-w-0 flex-1 bg-transparent py-1 text-sm",
            "outline-none placeholder:text-zinc-400",
          )}
        />
        <AnimatePresence initial={false}>
          {value.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
            >
              <Button size="xs" onClick={onSubmit}>
                Add
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default UrlField;
