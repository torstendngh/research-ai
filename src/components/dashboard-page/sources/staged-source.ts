import type { NewSourceInput } from "../dashboard-context";
import { hostnameOf } from "./source-utils";

/** A source queued in the add dialog — a NewSourceInput plus a local list key. */
export type StagedSource = NewSourceInput & { id: string };

let stagedIdCounter = 0;
export function stagedId(): string {
  stagedIdCounter += 1;
  return `staged-${stagedIdCounter}`;
}

export function stagedTitle(item: StagedSource): string {
  if (item.kind === "pdf") return item.file.name;
  if (item.kind === "url") return item.url;
  return item.title;
}

export function stagedSubtitle(item: StagedSource): string {
  if (item.kind === "pdf") return "PDF";
  if (item.kind === "url") return hostnameOf(item.url) ?? "Web page";
  const words = item.text.trim().split(/\s+/).length;
  return `Text · ${words} word${words === 1 ? "" : "s"}`;
}
