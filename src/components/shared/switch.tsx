"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/tailwind-utils";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "data-[state=checked]:bg-zinc-900 data-[state=unchecked]:bg-zinc-200",
        "data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform",
          "data-[state=unchecked]:translate-x-0",
          "group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3",
          "group-data-[size=default]/switch:data-[state=checked]:translate-x-4",
          "group-data-[size=sm]/switch:data-[state=checked]:translate-x-3",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
