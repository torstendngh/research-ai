"use client";

import { cn } from "@/lib/tailwind-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface IconButtonProps extends React.ComponentProps<"button"> {
  /** Accessible name, shown as the tooltip. */
  label: string;
  /** Which side of the button the tooltip appears on. */
  side?: "top" | "right" | "bottom" | "left";
}

/** Small square icon button with a tooltip; the standard for icon-only actions. */
const IconButton = ({ label, side = "bottom", className, children, ...props }: IconButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={label}
        className={cn(
          "flex items-center justify-center rounded-md p-1 text-zinc-400",
          "cursor-pointer hover:bg-zinc-100 hover:text-zinc-700",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side={side}>{label}</TooltipContent>
  </Tooltip>
);

export default IconButton;
