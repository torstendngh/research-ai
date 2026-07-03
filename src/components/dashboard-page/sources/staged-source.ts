import type { NewSourceInput } from "../dashboard-context";
import { hostnameOf } from "./source-utils";

/**
 * A source queued in the add dialog — a NewSourceInput plus a local list key.
 * URL entries staged from AI discovery carry the suggested page title so the
 * queue shows something friendlier than the raw URL.
 */
export type StagedSource = NewSourceInput & { id: string };

let stagedIdCounter = 0;
export function stagedId(): string {
  stagedIdCounter += 1;
  return `staged-${stagedIdCounter}`;
}

export function stagedTitle(item: StagedSource): string {
  if (item.kind === "pdf") return item.file.name;
  if (item.kind === "url") return item.title || item.url;
  return item.title;
}

export function stagedSubtitle(item: StagedSource): string {
  if (item.kind === "pdf") return `PDF · ${formatBytes(item.file.size)}`;
  if (item.kind === "url") return hostnameOf(item.url) ?? "Web page";
  const words = item.text.trim().split(/\s+/).length;
  return `Text · ${words} word${words === 1 ? "" : "s"}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

const LARGE_PDF_BYTES = 25 * 1024 * 1024;
// Mirrors USAGE_LIMITS.storageBytes (server-only module, so restated here).
const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;
const LONG_TEXT_CHARS = 500_000;

/** A size concern worth flagging on a staged row, or null when fine. */
export function stagedWarning(
  item: StagedSource,
): { text: string; tone: "warn" | "error" } | null {
  if (item.kind === "pdf") {
    if (item.file.size > STORAGE_LIMIT_BYTES) {
      return { text: "Exceeds the 500 MB storage limit", tone: "error" };
    }
    if (item.file.size > LARGE_PDF_BYTES) {
      return { text: "Large file — slower to process", tone: "warn" };
    }
  }
  if (item.kind === "text" && item.text.length > LONG_TEXT_CHARS) {
    return { text: "Very long text — slower to process", tone: "warn" };
  }
  return null;
}

/** Rough per-item processing time. Ingestion parses, chunks, and summarizes. */
function estimateSeconds(item: StagedSource): number {
  if (item.kind === "pdf") return 20 + (item.file.size / (1024 * 1024)) * 1.5;
  if (item.kind === "url") return 25;
  const words = item.text.trim().split(/\s+/).length;
  return 15 + words / 200;
}

/**
 * Fuzzy wall-clock estimate for a staged batch. Items ingest in parallel and
 * one project-meta generation runs after, so this is roughly the slowest item
 * plus overhead — deliberately vague ("about a minute") since network and
 * model latency dominate.
 */
export function estimateBatchLabel(staged: StagedSource[]): string | null {
  if (staged.length === 0) return null;
  const slowest = Math.max(...staged.map(estimateSeconds));
  const seconds = slowest + 10 + 4 * (staged.length - 1);
  if (seconds < 50) return "under a minute";
  if (seconds < 100) return "about a minute";
  return `about ${Math.round(seconds / 60)} min`;
}
