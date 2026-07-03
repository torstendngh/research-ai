"use client";

import { useEffect, useRef, useState } from "react";
import { postApi } from "@/lib/api-client";
import type { PromptContextChip, PromptControls } from "./dashboard-context";

interface ProjectScoped {
  projectId: string;
}

interface UseGeneratedListParams<T extends { id: string }> {
  projectId: string | null;
  hasReadySources: boolean;
  /** API route that generates one item from `{ projectId, prompt }`. */
  apiPath: string;
  load: (projectId: string) => Promise<T[]>;
  remove: (id: string) => Promise<void>;
  buildPrompt: (draft: string, chips: PromptContextChip[]) => string;
  /** The prompt draft + context chips this tab reads from and writes back to. */
  prompt: PromptControls;
}

/**
 * The shared engine behind the podcast and quiz tabs: loads the project's
 * saved items, runs a single-flight generation from the prompt draft + context
 * chips, and deletes items — all tagged with the project they belong to so a
 * result never leaks into another project after a switch. Only the entity type,
 * API route, and prompt wording differ between the two callers.
 */
export function useGeneratedList<T extends { id: string }>({
  projectId,
  hasReadySources,
  apiPath,
  load,
  remove,
  buildPrompt,
  prompt,
}: UseGeneratedListParams<T>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Async results are tagged with the project they belong to and filtered at
  // render time, so nothing from a previous project ever leaks into the current
  // one. `loaded === null` for the current project = still loading.
  const [loaded, setLoaded] = useState<{
    projectId: string;
    list: T[];
  } | null>(null);
  // The generation currently in flight (single-flight).
  const [generating, setGenerating] = useState<
    (ProjectScoped & { prompt: string }) | null
  >(null);
  const [generateError, setGenerateError] = useState<
    (ProjectScoped & { message: string }) | null
  >(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    load(projectId)
      .then((list) => {
        if (active) setLoaded({ projectId, list });
      })
      .catch(() => {
        if (active) setLoaded({ projectId, list: [] });
      });
    return () => {
      active = false;
    };
  }, [projectId, load]);

  // Focus when another view fills the prompt (e.g. a mind-map node).
  useEffect(() => {
    if (prompt.focusNonce === 0) return;
    const element = textareaRef.current;
    if (!element) return;
    element.focus();
    const end = element.value.length;
    element.setSelectionRange(end, end);
  }, [prompt.focusNonce]);

  const canGenerate =
    !!projectId &&
    !generating &&
    hasReadySources &&
    (prompt.draft.trim().length > 0 || prompt.chips.length > 0);

  const generate = async () => {
    if (!canGenerate || !projectId) return;
    const draft = prompt.draft;
    const activeChips = prompt.chips;
    const text = buildPrompt(draft, activeChips);
    const target = projectId;

    prompt.setDraft("");
    prompt.clearChips();
    setGenerating({ projectId: target, prompt: text });
    setGenerateError(null);

    const result = await postApi<T>(apiPath, { projectId: target, prompt: text });

    setGenerating(null);
    if (result.ok) {
      // Only lands in the list it was started for; if the user switched
      // projects meanwhile, the item is simply there on their next visit.
      setLoaded((prev) =>
        prev && prev.projectId === target
          ? { projectId: target, list: [result.data, ...prev.list] }
          : prev,
      );
    } else {
      setGenerateError({ projectId: target, message: result.error });
      prompt.setDraft(draft);
      activeChips.forEach(prompt.addChip);
    }
  };

  const deleteItem = async (id: string, onRemoved?: () => void) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await remove(id);
      setLoaded((prev) =>
        prev
          ? { ...prev, list: prev.list.filter((item) => item.id !== id) }
          : prev,
      );
      onRemoved?.();
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Only expose state that belongs to the project currently in view.
  const items = loaded && loaded.projectId === projectId ? loaded.list : null;
  const generatingHere =
    generating && generating.projectId === projectId ? generating : null;
  const errorHere =
    generateError && generateError.projectId === projectId
      ? generateError.message
      : null;

  return {
    items,
    generatingHere,
    errorHere,
    deletingIds,
    isGenerating: generating !== null,
    canGenerate,
    generate,
    deleteItem,
    textareaRef,
  };
}
