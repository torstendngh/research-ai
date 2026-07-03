import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/tailwind-utils";

const buttonVariants = cva(
  cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap",
    "transition-colors outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-zinc-300",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white hover:bg-zinc-800",
        outline:
          "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 aria-expanded:bg-zinc-50",
        ghost:
          "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 aria-expanded:bg-zinc-100 aria-expanded:text-zinc-800",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        "destructive-outline":
          "border border-red-200 bg-white text-red-600 hover:bg-red-50",
        link: "text-zinc-800 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        xs: "h-7 px-2 text-xs",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
