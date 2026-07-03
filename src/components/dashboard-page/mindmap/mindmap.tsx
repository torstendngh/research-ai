"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Background, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { Button } from "@/components/shared/button";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import { postApi } from "@/lib/api-client";
import type { MindmapState } from "@/lib/mindmap-sync";
import type { MindmapGraph } from "@/lib/mindmap";

/** Sync via the API route; throws on failure so callers keep their catch flow. */
async function syncMindmap(
  projectId: string,
  force = false,
): Promise<MindmapState> {
  const result = await postApi<MindmapState>(
    `/api/projects/${projectId}/mindmap`,
    { force },
  );
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
import { mindmapChip } from "../prompt-context-format";
import { useDashboard } from "../dashboard-context";
import CenteredMessage from "./centered-message";
import { toFlow } from "./layout";
import { nodeTypes } from "./mindmap-node";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import MindmapToolbar from "./mindmap-toolbar";
import { NodeMenuContext } from "./node-menu-context";

const MindMap = () => {
  const { project, sources, chatPrompt, podcastPrompt, quizPrompt, setMainTab } =
    useDashboard();
  // Each addChip is stable (memoized in usePromptControls); depend on those
  // rather than the enclosing prompt objects, which are new each render.
  const { addChip: addChatChip } = chatPrompt;
  const { addChip: addPodcastChip } = podcastPrompt;
  const { addChip: addQuizChip } = quizPrompt;
  const projectId = project?.id ?? null;

  // Regenerate whenever the set of ready sources changes.
  const readySignature = useMemo(
    () =>
      sources
        .filter((source) => source.status === "ready")
        .map((source) => source.id)
        .sort()
        .join(","),
    [sources],
  );

  const handleAsk = useCallback(
    (path: string[]) => {
      if (path.length === 0) return;
      addChatChip(mindmapChip(path));
      setMainTab("chat");
    },
    [addChatChip, setMainTab],
  );

  const handlePodcast = useCallback(
    (path: string[]) => {
      if (path.length === 0) return;
      addPodcastChip(mindmapChip(path));
      setMainTab("podcasts");
    },
    [addPodcastChip, setMainTab],
  );

  const handleQuiz = useCallback(
    (path: string[]) => {
      if (path.length === 0) return;
      addQuizChip(mindmapChip(path));
      setMainTab("quizCards");
    },
    [addQuizChip, setMainTab],
  );

  const menuHandlers = useMemo(
    () => ({ ask: handleAsk, podcast: handlePodcast, quiz: handleQuiz }),
    [handleAsk, handlePodcast, handleQuiz],
  );

  // Last successful result, tagged with the project + source signature it was
  // generated for. Loading/updating state is *derived* from whether this still
  // matches the current project + sources, which keeps the auto-sync effect from
  // setting state synchronously (and lets us keep showing the old map while a
  // new one is generated).
  const [loaded, setLoaded] = useState<{
    projectId: string;
    signature: string;
    graph: MindmapGraph;
  } | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const currentKey = `${projectId ?? ""}:${readySignature}`;

  // Auto-sync when the project or its ready sources change.
  useEffect(() => {
    if (!projectId) return;
    let active = true;
    syncMindmap(projectId)
      .then((result) => {
        if (active) setLoaded({ projectId, signature: readySignature, graph: result.graph });
      })
      .catch(() => {
        if (active) setErrorKey(`${projectId}:${readySignature}`);
      });
    return () => {
      active = false;
    };
  }, [projectId, readySignature]);

  const regenerate = async () => {
    if (!projectId || isRegenerating) return;
    setIsRegenerating(true);
    try {
      const result = await syncMindmap(projectId, true);
      setLoaded({ projectId, signature: readySignature, graph: result.graph });
      setErrorKey(null);
    } catch {
      setErrorKey(`${projectId}:${readySignature}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Only show a result that belongs to the project currently in view.
  const current = loaded && loaded.projectId === projectId ? loaded : null;
  const graph = current?.graph ?? null;
  const isUpToDate = current?.signature === readySignature;
  const isError = errorKey === currentKey;

  const { nodes, edges } = useMemo(
    () => (graph ? toFlow(graph) : { nodes: [], edges: [] }),
    [graph],
  );

  const hasNodes = nodes.length > 0;
  const showInitialLoader = !graph && !isError && !!projectId;
  const isUpdating = isRegenerating || (!isUpToDate && !isError);

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      <div className="relative flex-1 min-h-0">
        {showInitialLoader ? (
          <CenteredMessage>
            <LoadingIcon className="size-5 animate-spin text-zinc-400" />
          </CenteredMessage>
        ) : isError ? (
          <CenteredMessage>
            <p className="text-sm text-zinc-500">Couldn&apos;t build the mind map.</p>
            <Button variant="outline" size="sm" onClick={regenerate}>
              Try again
            </Button>
          </CenteredMessage>
        ) : !hasNodes ? (
          <CenteredMessage>
            <p className="max-w-xs text-center text-sm text-zinc-400">
              Add sources to this project to generate a mind map.
            </p>
          </CenteredMessage>
        ) : (
          <NodeMenuContext.Provider value={menuHandlers}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                proOptions={{ hideAttribution: true }}
                className="bg-zinc-50"
              >
                <Background color="#e4e4e7" gap={16} />
                <MindmapToolbar
                  onRegenerate={() => setConfirmRegen(true)}
                  disabled={!projectId || isUpdating}
                  isUpdating={isUpdating}
                />
              </ReactFlow>
            </ReactFlowProvider>
          </NodeMenuContext.Provider>
        )}
      </div>

      <ConfirmDialog
        open={confirmRegen}
        onClose={() => setConfirmRegen(false)}
        onConfirm={() => {
          // Fire-and-forget: close immediately and let the toolbar show the
          // inline "Generating" state while the new map builds.
          regenerate();
        }}
        title="Regenerate mind map?"
        description="This replaces the current mind map with a freshly generated one. This cannot be undone."
        confirmLabel="Regenerate"
        destructive={false}
      />
    </div>
  );
};

export default MindMap;
