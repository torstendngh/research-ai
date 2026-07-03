"use client";

import { cn } from "@/lib/tailwind-utils";
import Link from "next/link";
import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shared/tooltip";
import { useNavbar } from "./navbar-context";

interface ButtonProps {
  icon: ReactNode;
  label?: string | null;
  /** Always shown as a tooltip, regardless of navbar state (for icon-only buttons). */
  tooltip?: string;
  className?: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const Button = ({
  icon,
  label,
  tooltip,
  className,
  href,
  active,
  disabled,
  onClick,
}: ButtonProps) => {
  const { isNavbarOpen } = useNavbar();

  const classes = cn(
    "flex items-center gap-2 rounded-md",
    "cursor-pointer select-none hover:bg-zinc-200 active:bg-zinc-300 not-hover:transition-colors not-hover:duration-100",
    "transition-[padding]",
    isNavbarOpen ? "px-2 py-1.5" : "p-2",
    active && "bg-zinc-200",
    disabled && "opacity-50 pointer-events-none",
    className,
  );

  const content = (
    <>
      <div className="flex items-center justify-center shrink-0 [&>svg]:size-5">
        {icon}
      </div>
      {label && isNavbarOpen && (
        <span className="truncate text-sm min-w-0">{label}</span>
      )}
    </>
  );

  const element = href ? (
    <Link
      href={href}
      aria-label={label ?? tooltip ?? undefined}
      className={classes}
    >
      {content}
    </Link>
  ) : (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label ?? tooltip ?? undefined}
      className={classes}
    >
      {content}
    </button>
  );

  // When the navbar is minimized the label is hidden, so show it as a tooltip.
  // An explicit `tooltip` is always shown (for buttons that never render a label).
  const tooltipText = tooltip ?? (!isNavbarOpen ? label : null);

  if (tooltipText) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{element}</TooltipTrigger>
        <TooltipContent side="right">{tooltipText}</TooltipContent>
      </Tooltip>
    );
  }

  return element;
};

export default Button;
