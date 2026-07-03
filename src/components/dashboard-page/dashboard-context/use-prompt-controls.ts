"use client";

import { useCallback, useState } from "react";
import type { PromptContextChip } from "./types";

/**
 * A prompt draft shared through the dashboard context so other panels can
 * compose a message without sending it (e.g. a mind-map node prefilling the
 * chat or podcast prompt). `focusNonce` is bumped whenever something fills
 * the prompt, so the input can focus itself.
 */
export function usePromptControls() {
  const [draft, setDraft] = useState<string>("");
  const [chips, setChips] = useState<PromptContextChip[]>([]);
  const [focusNonce, setFocusNonce] = useState<number>(0);

  const fill = useCallback((value: string) => {
    setDraft(value);
    setFocusNonce((nonce) => nonce + 1);
  }, []);

  const addChip = useCallback((chip: PromptContextChip) => {
    setChips((prev) =>
      prev.some((item) => item.id === chip.id) ? prev : [...prev, chip],
    );
    setFocusNonce((nonce) => nonce + 1);
  }, []);

  const removeChip = useCallback((id: string) => {
    setChips((prev) => prev.filter((chip) => chip.id !== id));
  }, []);

  const clearChips = useCallback(() => {
    setChips([]);
  }, []);

  /** Called (during render) when navigating to a different project. */
  const reset = useCallback(() => {
    setDraft("");
    setChips([]);
  }, []);

  return {
    draft,
    setDraft,
    fill,
    focusNonce,
    chips,
    addChip,
    removeChip,
    clearChips,
    reset,
  };
}
