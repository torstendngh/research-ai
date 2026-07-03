"use client";

import { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import { cn } from "@/lib/tailwind-utils";
import LoadingIcon from "@/components/shared/icons/loading-icon";

interface SendButtonProps extends ComponentPropsWithoutRef<"button"> {
  /** Swaps the icon for a spinner while an action is in flight. */
  busy?: boolean;
  label: string;
  /** The idle icon (e.g. arrow-up, ai-search). */
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * The round dark action button used to submit a prompt or run a search.
 * Spreads props and forwards its ref so it can act as a Radix `asChild` trigger.
 */
const SendButton = ({
  busy,
  label,
  children,
  className,
  ref,
  ...props
}: SendButtonProps) => {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        "flex items-center justify-center shrink-0",
        "size-8 rounded-full",
        "bg-zinc-900 text-white",
        "transition-colors",
        "cursor-pointer select-none hover:bg-zinc-700 active:bg-zinc-600",
        "disabled:opacity-40 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      {busy ? <LoadingIcon className="size-5 animate-spin" /> : children}
    </button>
  );
};

export default SendButton;
