import type { MainTab } from "./types";

// The URL-facing name for each tab. Kept kebab-case so the `?tab=` value reads
// cleanly (e.g. `?tab=mind-map`) rather than exposing the camelCase MainTab id.
export const TAB_TO_SLUG: Record<MainTab, string> = {
  sources: "sources",
  overview: "overview",
  chat: "chat",
  mindMap: "mind-map",
  podcasts: "podcasts",
  quizCards: "quiz-cards",
  options: "options",
};

const SLUG_TO_TAB = new Map<string, MainTab>(
  (Object.entries(TAB_TO_SLUG) as [MainTab, string][]).map(([tab, slug]) => [
    slug,
    tab,
  ]),
);

/** Every tab except Sources needs at least one source before it's reachable. */
export function tabRequiresSources(tab: MainTab): boolean {
  return tab !== "sources";
}

/**
 * Resolve a `?tab=` slug to the tab that should actually open. An unknown slug
 * falls back to the project's default (Overview, or Sources when empty), and a
 * source-gated tab in a project without sources always lands on Sources — so
 * typing e.g. `?tab=chat` on a fresh project opens Sources instead.
 */
export function resolveTabFromSlug(
  slug: string | null | undefined,
  hasSources: boolean,
): MainTab {
  const tab = slug ? SLUG_TO_TAB.get(slug) : undefined;
  if (!tab) return hasSources ? "overview" : "sources";
  if (!hasSources && tabRequiresSources(tab)) return "sources";
  return tab;
}
