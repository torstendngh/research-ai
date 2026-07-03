"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { Project } from "@/lib/actions/projects";

const MAX_RESULTS = 8;

function normalize(value: string | null | undefined) {
  return value?.toLowerCase().trim() ?? "";
}

function scoreProject(project: Project, query: string) {
  if (!query) return 1;

  const title = normalize(project.title);
  const description = normalize(project.description);

  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (title.includes(query)) return 60;
  if (description.includes(query)) return 30;

  return 0;
}

function byUpdatedDesc(a: Project, b: Project) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

export function useProjectSearch(projects: Project[]) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [requestedActiveIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const normalizedQuery = normalize(deferredQuery);

    return projects
      .map((project) => ({
        project,
        score: scoreProject(project, normalizedQuery),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || byUpdatedDesc(a.project, b.project))
      .slice(0, MAX_RESULTS)
      .map(({ project }) => project);
  }, [deferredQuery, projects]);

  const activeIndex =
    results.length === 0 ? 0 : Math.min(requestedActiveIndex, results.length - 1);

  const updateQuery = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const moveActive = (delta: number) => {
    if (results.length === 0) return;
    setActiveIndex((index) => {
      const currentIndex = Math.min(index, results.length - 1);
      return (currentIndex + delta + results.length) % results.length;
    });
  };

  return {
    query,
    setQuery: updateQuery,
    results,
    activeIndex,
    setActiveIndex,
    activeProject: results[activeIndex] ?? null,
    moveActive,
  };
}
