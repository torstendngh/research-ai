"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/actions/projects";
import type { Source } from "@/lib/actions/sources";
import { postApi } from "@/lib/api-client";
import type { NewSourceInput, PendingSource } from "./types";

/**
 * Source ingestion state, hoisted above the dashboard route.
 *
 * Adding the first source on the draft (unsaved) project creates the real
 * project and navigates from `/dashboard` to `/dashboard/[id]` — a route
 * segment change that *remounts* the dashboard page. If the pending
 * "processing" rows lived in that page's state they'd be wiped by the remount
 * (the row would vanish until a manual reload). So this provider is mounted in
 * the dashboard layout, which persists across that navigation, and each pending
 * row is tagged with its `projectId` so every project's page shows only its own.
 *
 * Ingestion runs in the background here; the sources list renders progress. A
 * "processing" row appears immediately for each staged source and either
 * resolves into the real server row (via router.refresh) or flips to "failed".
 * A batch ingests in parallel (each `skipProjectMeta`) and the project meta is
 * regenerated once after the batch settles — one AI generation per batch.
 */
interface PendingSourcesStore {
  pendingSources: PendingSource[];
  addSources: (
    inputs: NewSourceInput[],
    ensureProject: () => Promise<Project>,
  ) => void;
  dismissPendingSource: (id: string) => void;
  removePendingSources: (ids: string[]) => void;
}

const PendingSourcesContext = createContext<PendingSourcesStore | null>(null);

export function PendingSourcesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pendingSources, setPendingSources] = useState<PendingSource[]>([]);

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
    (inputs: NewSourceInput[], ensureProject: () => Promise<Project>) => {
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
          // Unknown until the project is ensured; shown on the draft page
          // (projectId === null) until then, then re-tagged to the real id.
          projectId: null,
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

        // Tag the rows with the now-known project so they follow the navigation
        // to `/dashboard/[target.id]` and render on that project's page.
        const stagedIds = new Set(staged.map((s) => s.pending.id));
        setPendingSources((prev) =>
          prev.map((p) => (stagedIds.has(p.id) ? { ...p, projectId: target.id } : p)),
        );

        // One meta generation for the whole batch (the ingests skipped theirs).
        const outcomes = await Promise.all(
          staged.map(({ input, pending }) => ingestOne(pending.id, target.id, input)),
        );

        if (outcomes.some(Boolean)) {
          await postApi(`/api/projects/${target.id}/meta`, {});
          router.refresh();
        }
      })();
    },
    [ingestOne, markFailed, router],
  );

  const dismissPendingSource = useCallback((id: string) => {
    setPendingSources((prev) => prev.filter((pending) => pending.id !== id));
  }, []);

  const removePendingSources = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const drop = new Set(ids);
    setPendingSources((prev) => prev.filter((pending) => !drop.has(pending.id)));
  }, []);

  const value = useMemo(
    () => ({ pendingSources, addSources, dismissPendingSource, removePendingSources }),
    [pendingSources, addSources, dismissPendingSource, removePendingSources],
  );

  return (
    <PendingSourcesContext.Provider value={value}>
      {children}
    </PendingSourcesContext.Provider>
  );
}

export function usePendingSourcesStore() {
  const ctx = useContext(PendingSourcesContext);
  if (!ctx) {
    throw new Error("usePendingSourcesStore must be used within a PendingSourcesProvider");
  }
  return ctx;
}

/**
 * The pending rows to show on one project's page: those tagged for this project
 * (or the still-untagged draft rows when this *is* the draft page), minus any
 * whose ingestion already landed in the refreshed server `sources` list.
 * Settled rows are pruned from the store so it doesn't grow across a session.
 */
export function useProjectPendingSources(sources: Source[], projectId: string | null) {
  const { pendingSources, removePendingSources } = usePendingSourcesStore();

  const forThisProject = useMemo(
    () => pendingSources.filter((p) => p.projectId === projectId),
    [pendingSources, projectId],
  );

  useEffect(() => {
    const settled = forThisProject
      .filter((p) => p.sourceId && sources.some((s) => s.id === p.sourceId))
      .map((p) => p.id);
    removePendingSources(settled);
  }, [forThisProject, sources, removePendingSources]);

  return useMemo(
    () =>
      forThisProject.filter(
        (p) => !(p.sourceId && sources.some((s) => s.id === p.sourceId)),
      ),
    [forThisProject, sources],
  );
}
