"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
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
import { NODE_HEIGHT, rootIdsOf, toFlow } from "./layout";
import { nodeTypes, type MindmapNodeData } from "./mindmap-node";
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

  // Which nodes are expanded (children shown). Reset to just the roots whenever
  // a new graph loads (each load is a fresh object, incl. regenerate), so the
  // map opens showing only the first layer.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [expandedFor, setExpandedFor] = useState<MindmapGraph | null>(null);
  if (graph !== expandedFor) {
    setExpandedFor(graph);
    setExpanded(graph ? new Set(rootIdsOf(graph)) : new Set());
  }

  const toggleNode = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Explode: reveal every node. Collapse: back to the first layer (roots only).
  // Both re-frame the whole (new) layout — see the fit-view effect below. Set
  // the flag before the state change so it's live when the new nodes render.
  const fitAfterLayoutRef = useRef(false);
  const expandAll = useCallback(() => {
    fitAfterLayoutRef.current = true;
    setExpanded(graph ? new Set(graph.nodes.map((node) => node.id)) : new Set());
  }, [graph]);
  const collapseAll = useCallback(() => {
    fitAfterLayoutRef.current = true;
    setExpanded(graph ? new Set(rootIdsOf(graph)) : new Set());
  }, [graph]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if ((node.data as unknown as MindmapNodeData).hasChildren) {
        toggleNode(node.id);
      }
    },
    [toggleNode],
  );

  const { nodes, edges } = useMemo(
    () => (graph ? toFlow(graph, expanded) : { nodes: [], edges: [] }),
    [graph, expanded],
  );

  // Center point of the root node (positions are top-left; width is per-column).
  const rootFocus = useMemo(() => {
    const root = nodes.find((node) => node.data.isRoot);
    if (!root) return null;
    const width = typeof root.style?.width === "number" ? root.style.width : 140;
    return { x: root.position.x + width / 2, y: root.position.y + NODE_HEIGHT / 2 };
  }, [nodes]);

  // Start at 100% zoom with the root node centered (rather than fit-to-view).
  // Keyed on the graph (not on `rootFocus`) so expanding/collapsing a branch
  // doesn't yank the viewport back — only a fresh graph re-centers. Read via a
  // ref so it uses the current root position without re-running on layout shifts.
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const rootFocusRef = useRef(rootFocus);
  useEffect(() => {
    rootFocusRef.current = rootFocus;
  }, [rootFocus]);
  useEffect(() => {
    const focus = rootFocusRef.current;
    if (flow && focus) {
      flow.setCenter(focus.x, focus.y, { zoom: 1, duration: 0 });
    }
  }, [flow, graph]);

  // After Expand all / Collapse all, frame the new layout. Runs once the
  // updated nodes have rendered (this effect is keyed on `nodes`); the rAF lets
  // React Flow measure the freshly shown/hidden nodes before fitting.
  useEffect(() => {
    if (!fitAfterLayoutRef.current || !flow) return;
    fitAfterLayoutRef.current = false;
    const raf = requestAnimationFrame(() =>
      flow.fitView({ padding: 0.2, duration: 200 }),
    );
    return () => cancelAnimationFrame(raf);
  }, [nodes, flow]);

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
                onInit={setFlow}
                onNodeClick={handleNodeClick}
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
                  onExpandAll={expandAll}
                  onCollapseAll={collapseAll}
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
