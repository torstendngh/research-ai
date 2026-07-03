"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  /** Project ids whose title/description/topics are currently regenerating. */
  metaGeneratingProjectIds: ReadonlySet<string>;
  addSources: (
    inputs: NewSourceInput[],
    ensureProject: () => Promise<Project>,
  ) => void;
  /** Regenerate a project's title/description/topics (serialized per project). */
  regenerateMeta: (projectId: string) => Promise<void>;
  dismissPendingSource: (id: string) => void;
  removePendingSources: (ids: string[]) => void;
}

const PendingSourcesContext = createContext<PendingSourcesStore | null>(null);

export function PendingSourcesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pendingSources, setPendingSources] = useState<PendingSource[]>([]);
  // Projects whose meta (title/description/topics) is regenerating after a
  // batch — the overview shows a loader for these.
  const [metaGeneratingProjectIds, setMetaGeneratingProjectIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const setMetaGenerating = useCallback((projectId: string, active: boolean) => {
    setMetaGeneratingProjectIds((prev) => {
      if (active === prev.has(projectId)) return prev;
      const next = new Set(prev);
      if (active) next.add(projectId);
      else next.delete(projectId);
      return next;
    });
  }, []);

  // While anything is ingesting, poll the server list so the UI reconciles
  // even when a one-off refresh raced or was dropped — pending rows resolve
  // into their server rows (or reveal failures) without a manual reload.
  const hasPending = pendingSources.length > 0;
  useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [hasPending, router]);

  // One meta generation per project at a time. Concurrent batches chain onto
  // the in-flight run instead of racing it, and each run retries once — the
  // overview renders from this, so a silently dropped run left it empty.
  const metaRuns = useRef<Map<string, Promise<void>>>(new Map());
  const runProjectMeta = useCallback(
    (projectId: string) => {
      const prev = metaRuns.current.get(projectId) ?? Promise.resolve();
      const run = prev.then(async () => {
        setMetaGenerating(projectId, true);
        try {
          const result = await postApi(`/api/projects/${projectId}/meta`, {});
          if (!result.ok) {
            await postApi(`/api/projects/${projectId}/meta`, {});
          }
          router.refresh();
        } finally {
          setMetaGenerating(projectId, false);
        }
      });
      metaRuns.current.set(projectId, run);
      void run.then(() => {
        if (metaRuns.current.get(projectId) === run) {
          metaRuns.current.delete(projectId);
        }
      });
      return run;
    },
    [router, setMetaGenerating],
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
                ? input.title || input.url
                : input.title,
          url: input.kind === "url" ? input.url : undefined,
          fileName: input.kind === "pdf" ? input.file.name : undefined,
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
          await runProjectMeta(target.id);
        }
      })();
    },
    [ingestOne, markFailed, runProjectMeta],
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
    () => ({
      pendingSources,
      metaGeneratingProjectIds,
      addSources,
      regenerateMeta: runProjectMeta,
      dismissPendingSource,
      removePendingSources,
    }),
    [
      pendingSources,
      metaGeneratingProjectIds,
      addSources,
      runProjectMeta,
      dismissPendingSource,
      removePendingSources,
    ],
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
 * A pending row is settled once the server list carries its row. Matched by
 * `sourceId` when the ingest response already arrived, otherwise by identity
 * (URL / file name / title): the server inserts its row with status
 * "processing" at the *start* of ingestion, so a refresh triggered by a
 * batch-mate finishing can surface it while this entry's request is still in
 * flight — matching by id alone rendered those sources twice. Each server row
 * settles at most one pending row (`claimed`) so two identical staged items
 * don't both vanish against a single server row.
 */
function settledPendingIds(pending: PendingSource[], sources: Source[]): Set<string> {
  const claimed = new Set<string>();
  const settled = new Set<string>();

  for (const p of pending) {
    // Failed rows settle too when a server row exists (the ingest got far
    // enough to insert one, so the server row carries the status and error —
    // keeping the client copy would show the failure twice). Failures without
    // a server row (network, quota) stay until dismissed.
    const match = sources.find((s) => {
      if (claimed.has(s.id)) return false;
      if (p.sourceId) return s.id === p.sourceId;
      if (p.kind === "pdf") {
        return s.source_type === "pdf" && s.file_name === p.fileName;
      }
      if (p.kind === "url") {
        return s.source_type === "url" && s.url === p.url;
      }
      return s.source_type === "text" && s.title === p.title;
    });

    if (match) {
      claimed.add(match.id);
      settled.add(p.id);
    }
  }

  return settled;
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

  const settled = useMemo(
    () => settledPendingIds(forThisProject, sources),
    [forThisProject, sources],
  );

  useEffect(() => {
    removePendingSources([...settled]);
  }, [settled, removePendingSources]);

  return useMemo(
    () => forThisProject.filter((p) => !settled.has(p.id)),
    [forThisProject, settled],
  );
}
