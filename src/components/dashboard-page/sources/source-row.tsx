import type { ReactNode } from "react";
import { cn } from "@/lib/tailwind-utils";

/** One row in the sources list: icon, title (optionally a link), subtitle, action. */
const SourceRow = ({
  icon,
  title,
  titleHref,
  subtitle,
  subtitleTone = "muted",
  subtitleTitle,
  action,
  dimmed = false,
}: {
  icon: ReactNode;
  title: string;
  titleHref?: string | null;
  subtitle: string;
  subtitleTone?: "muted" | "error";
  subtitleTitle?: string;
  action: ReactNode;
  /** De-emphasise the icon/title when the source is turned off. */
  dimmed?: boolean;
}) => (
  <li className={cn("group flex items-center gap-3 overflow-hidden", "hover:bg-zinc-100 not-hover:transition-colors duration-100", "px-4 py-2 rounded-md")}>
    <div
      className={cn(
        "flex size-5 items-center justify-center text-zinc-400 shrink-0 transition-opacity",
        dimmed && "opacity-40",
      )}
    >
      {icon}
    </div>
    <div
      className={cn(
        "flex flex-col items-start justify-center overflow-hidden transition-opacity",
        dimmed && "opacity-40",
      )}
    >
      {titleHref ? (
        <a
          href={titleHref}
          target="_blank"
          rel="noreferrer"
          title={title}
          className="truncate w-full text-sm hover:underline underline-offset-2"
        >
          {title}
        </a>
      ) : (
        <span className="truncate w-full text-sm" title={title}>
          {title}
        </span>
      )}
      <span
        title={subtitleTitle}
        className={cn(
          "truncate w-full text-xs",
          subtitleTone === "error" ? "text-red-600" : "text-zinc-400",
        )}
      >
        {subtitle}
      </span>
    </div>
    <div className="ml-auto flex shrink-0 items-center gap-1">{action}</div>
  </li>
);

export default SourceRow;
