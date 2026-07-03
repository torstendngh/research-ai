"use client";

import { useState } from "react";
import { postApi } from "@/lib/api-client";
import type { DiscoveredSource } from "@/lib/rag/discover";

/**
 * "Ask AI to find sources on a topic" state for the add-sources dialog: runs
 * the discovery request and holds the suggestions. Staging the suggestions
 * into the batch is the dialog's job — this hook only fetches.
 */
export function useSourceDiscovery(projectId: string | null) {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discovery, setDiscovery] = useState<{
    topic: string;
    results: DiscoveredSource[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Resolves true on success so the caller knows to clear its input. */
  const discover = async (topic: string): Promise<boolean> => {
    const trimmed = topic.trim();
    if (!trimmed || isDiscovering) return false;

    setIsDiscovering(true);
    setError(null);

    const result = await postApi<DiscoveredSource[]>("/api/sources/discover", {
      projectId: projectId || null,
      topic: trimmed,
    });

    setIsDiscovering(false);
    if (result.ok) {
      setDiscovery({ topic: trimmed, results: result.data });
      return true;
    }
    setError(result.error);
    return false;
  };

  const reset = () => {
    setDiscovery(null);
    setError(null);
  };

  return {
    isDiscovering,
    discovery,
    error,
    discover,
    clearError: () => setError(null),
    dismiss: () => setDiscovery(null),
    reset,
  };
}
