import * as React from "react";

import { cn } from "@/lib/tailwind-utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-zinc-200 bg-white px-3 py-2",
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

export { Textarea };
