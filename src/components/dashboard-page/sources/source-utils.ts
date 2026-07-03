import type { DragEvent } from "react";
import type { Source } from "@/lib/actions/sources";

/** True when the drag payload contains OS files (not text/element drags). */
export function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
}

export function hostnameOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function sourceSubtitle(source: Source): { text: string; tone: "muted" | "error" } {
  if (source.status === "failed") {
    return { text: source.error_message ?? "Failed to process", tone: "error" };
  }
  if (source.status && source.status !== "ready") {
    return { text: "Processing…", tone: "muted" };
  }
  if (source.source_type === "url") {
    return { text: hostnameOf(source.url) ?? "Web page", tone: "muted" };
  }
  if (source.source_type === "text") {
    return { text: "Text", tone: "muted" };
  }
  return { text: "PDF", tone: "muted" };
}
