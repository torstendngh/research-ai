"use client";

import { useState } from "react";
import { postApi } from "@/lib/api-client";
import type { DiscoveredSource } from "@/lib/rag/discover";
import type { NewSourceInput } from "../dashboard-context";

/**
 * "Ask AI to find sources on a topic" state: runs the discovery request, tracks
 * which suggestions have already been added, and stages them (individually or
 * all at once) through the dashboard's `addSources`.
 */
export function useSourceDiscovery(
  projectId: string | null,
  addSources: (inputs: NewSourceInput[]) => void,
) {
  const [topic, setTopic] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discovery, setDiscovery] = useState<{
    topic: string;
    results: DiscoveredSource[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedUrls, setAddedUrls] = useState<Set<string>>(new Set());

  const onTopicChange = (value: string) => {
    setTopic(value);
    setError(null);
  };

  const discover = async () => {
    const trimmed = topic.trim();
    if (!trimmed || isDiscovering) return;

    setIsDiscovering(true);
    setError(null);

    const result = await postApi<DiscoveredSource[]>("/api/sources/discover", {
      projectId: projectId || null,
      topic: trimmed,
    });

    setIsDiscovering(false);
    if (result.ok) {
      setDiscovery({ topic: trimmed, results: result.data });
      setAddedUrls(new Set());
      setTopic("");
    } else {
      setError(result.error);
    }
  };

  const addSuggestion = (suggestion: DiscoveredSource) => {
    addSources([{ kind: "url", url: suggestion.url }]);
    setAddedUrls((prev) => new Set(prev).add(suggestion.url));
  };

  const addAllSuggestions = () => {
    const remaining = (discovery?.results ?? []).filter(
      (result) => !addedUrls.has(result.url),
    );
    // One batch so project meta regenerates once for all of them.
    addSources(remaining.map((result) => ({ kind: "url" as const, url: result.url })));
    setAddedUrls((prev) => {
      const next = new Set(prev);
      for (const result of remaining) next.add(result.url);
      return next;
    });
  };

  return {
    topic,
    onTopicChange,
    isDiscovering,
    discovery,
    error,
    addedUrls,
    discover,
    addSuggestion,
    addAllSuggestions,
    dismiss: () => setDiscovery(null),
  };
}
