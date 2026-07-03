"use client";

import { cn } from "@/lib/tailwind-utils";

interface CheckboxProps {
  checked?: boolean;
  /** Shows a dash instead of a check (e.g. "some selected"). */
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
}

/** Small controlled checkbox in the app's zinc style. */
const Checkbox = ({
  checked = false,
  indeterminate = false,
  onChange,
  className,
  "aria-label": ariaLabel,
}: CheckboxProps) => {
  const active = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-300 bg-white hover:border-zinc-400",
        className,
      )}
    >
      {indeterminate ? (
        <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
          <path
            d="M4 8h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : checked ? (
        <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden>
          <path
            d="m3.5 8.5 3 3 6-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  );
};

export default Checkbox;
