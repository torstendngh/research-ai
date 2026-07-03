import * as React from "react";

import { cn } from "@/lib/tailwind-utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-1",
        "text-sm text-zinc-800 transition-colors outline-none",
        "placeholder:text-zinc-400",
        "focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-100",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
