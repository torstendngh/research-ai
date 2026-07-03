"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/actions/projects";
import type { Source } from "@/lib/actions/sources";
import { postApi } from "@/lib/api-client";
import type { NewSourceInput, PendingSource } from "./types";

/**
 * Source ingestion. Runs in the background; the sources list shows progress:
 * a "processing" row appears immediately for each staged source and either
 * resolves into the real server row (via router.refresh) or flips to "failed"
 * with the error.
 *
 * `addSources` takes the whole batch at once: the items ingest in parallel
 * (each with `skipProjectMeta`) and the project's title/description/topics
 * are regenerated a single time after the batch settles — one AI generation
 * per batch instead of one per source.
 *
 * Ingestion goes through `POST /api/sources` (not a server action) so the
 * long-running uploads don't block other server actions in the tab.
 */
export function usePendingSources(
  sources: Source[],
  ensureProject: () => Promise<Project>,
) {
  const router = useRouter();
  const [pendingSources, setPendingSources] = useState<PendingSource[]>([]);

  // Once the refreshed server list contains an ingested source, its pending
  // entry has served its purpose (kept until then so the row never flickers).
  const visiblePendingSources = useMemo(
    () =>
      pendingSources.filter(
        (pending) =>
          !(pending.sourceId && sources.some((source) => source.id === pending.sourceId)),
      ),
    [pendingSources, sources],
  );

  const markFailed = useCallback((id: string, error: string) => {
    setPendingSources((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "failed" as const, error } : p)),
    );
  }, []);

  /** Ingest one staged source; resolves true on success. */
  const ingestOne = useCallback(
    async (pendingId: string, projectId: string, input: NewSourceInput): Promise<boolean> => {
      let result: { ok: true; data: { sourceId: string } } | { ok: false; error: string };

      try {
        if (input.kind === "pdf") {
          const formData = new FormData();
          formData.append("projectId", projectId);
          formData.append("file", input.file);
          formData.append("skipProjectMeta", "true");
          result = await postApi<{ sourceId: string }>("/api/sources", formData);
        } else if (input.kind === "url") {
          result = await postApi<{ sourceId: string }>("/api/sources", {
            projectId,
            url: input.url,
            skipProjectMeta: true,
          });
        } else {
          result = await postApi<{ sourceId: string }>("/api/sources", {
            projectId,
            title: input.title,
            text: input.text,
            skipProjectMeta: true,
          });
        }
      } catch (error: unknown) {
        markFailed(pendingId, error instanceof Error ? error.message : "Ingestion failed.");
        return false;
      }

      if (!result.ok) {
        markFailed(pendingId, result.error);
        return false;
      }

      setPendingSources((prev) =>
        prev.map((p) => (p.id === pendingId ? { ...p, sourceId: result.data.sourceId } : p)),
      );
      router.refresh();
      return true;
    },
    [markFailed, router],
  );

  const addSources = useCallback(
    (inputs: NewSourceInput[]) => {
      if (inputs.length === 0) return;

      const staged = inputs.map((input, index) => ({
        input,
        pending: {
          id: `pending-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
          kind: input.kind,
          title:
            input.kind === "pdf"
              ? input.file.name
              : input.kind === "url"
                ? input.url
                : input.title,
          status: "processing" as const,
        },
      }));

      setPendingSources((prev) => [...staged.map((s) => s.pending), ...prev]);

      void (async () => {
        let target: Project;
        try {
          target = await ensureProject();
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Could not create the project.";
          for (const { pending } of staged) markFailed(pending.id, message);
          return;
        }

        const outcomes = await Promise.all(
          staged.map(({ input, pending }) => ingestOne(pending.id, target.id, input)),
        );

        // One meta generation for the whole batch (the ingests skipped theirs).
        if (outcomes.some(Boolean)) {
          await postApi(`/api/projects/${target.id}/meta`, {});
          router.refresh();
        }
      })();
    },
    [ensureProject, ingestOne, markFailed, router],
  );

  const dismissPendingSource = useCallback((id: string) => {
    setPendingSources((prev) => prev.filter((pending) => pending.id !== id));
  }, []);

  /** Called (during render) when navigating to a different project. */
  const reset = useCallback(() => {
    setPendingSources([]);
  }, []);

  return {
    pendingSources: visiblePendingSources,
    addSources,
    dismissPendingSource,
    reset,
  };
}
