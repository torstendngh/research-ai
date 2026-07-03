import { cn } from "@/lib/tailwind-utils";
import type { ReactNode } from "react";

/**
 * The rounded card every dashboard view lives in. `title`/`leading`/`actions`
 * render a standard header (leading sits before the title, actions after);
 * omit all three for content that brings its own (e.g. the mind map).
 */
const Window = ({
  title,
  leading,
  actions,
  children,
  className,
}: {
  title?: string;
  leading?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col h-full min-w-0 overflow-hidden",
      "border border-zinc-200 bg-white shadow-md/3 rounded-xl",
      className,
    )}
  >
    {(title || leading || actions) && (
      <div className="flex min-h-11 items-center gap-2 border-b border-zinc-200 px-3 py-1.5">
        {leading && <div className="flex shrink-0 items-center gap-1">{leading}</div>}
        {title && (
          <p className="flex-1 truncate px-1 text-sm font-medium text-zinc-800">{title}</p>
        )}
        {actions && <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

export default Window;
