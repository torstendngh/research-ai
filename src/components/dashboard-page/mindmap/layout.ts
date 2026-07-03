import type { Edge, Node } from "@xyflow/react";
import type { MindmapGraph } from "@/lib/mindmap";

export const NODE_HEIGHT = 40;
const COLUMN_GAP = 56;
const SIBLING_GAP = 10;
const BRANCH_GAP = 22;

// Size nodes to their label (plus room for the ask button), with a generous
// minimum so the columns line up neatly instead of looking ragged.
function estimateWidth(label: string): number {
  return Math.min(200, Math.max(140, Math.round(label.length * 6.6) + 52));
}

/**
 * Deterministic tidy-tree layout, left to right:
 *
 *   - every depth level is one column; all nodes in a column share the same
 *     x position and width (the widest label in that column), so the left
 *     edges line up perfectly instead of looking ragged;
 *   - leaves are stacked top-to-bottom, parents sit centered on their
 *     children, and sibling subtrees never overlap by construction;
 *   - bezier edges fan out from a parent's right side to its children's left
 *     sides — no orthogonal segments that can run on top of each other.
 */
export function toFlow(graph: MindmapGraph): { nodes: Node[]; edges: Edge[] } {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));

  const pathOf = (id: string): string[] => {
    const labels: string[] = [];
    const seen = new Set<string>();
    let current = byId.get(id);
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      labels.push(current.label);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return labels.reverse();
  };

  const childrenOf = new Map<string, string[]>();
  const rootIds: string[] = [];

  for (const node of graph.nodes) {
    if (node.parentId && byId.has(node.parentId)) {
      const siblings = childrenOf.get(node.parentId) ?? [];
      siblings.push(node.id);
      childrenOf.set(node.parentId, siblings);
    } else {
      rootIds.push(node.id);
    }
  }

  // Pass 1: depth of every node → per-column width (widest label wins).
  const depthOf = new Map<string, number>();
  const columnWidth: number[] = [];

  const measure = (id: string, depth: number) => {
    depthOf.set(id, depth);
    const label = byId.get(id)?.label ?? "";
    columnWidth[depth] = Math.max(columnWidth[depth] ?? 0, estimateWidth(label));
    for (const childId of childrenOf.get(id) ?? []) measure(childId, depth + 1);
  };
  rootIds.forEach((rootId) => measure(rootId, 0));

  const columnX: number[] = [];
  for (let depth = 0, x = 0; depth < columnWidth.length; depth += 1) {
    columnX[depth] = x;
    x += columnWidth[depth] + COLUMN_GAP;
  }

  // Pass 2: leaves stack downward; each parent centers on its children. The
  // extra gap between sibling subtrees keeps branches visually grouped.
  const centerY = new Map<string, number>();
  let cursor = 0;

  const place = (id: string): number => {
    const childIds = childrenOf.get(id) ?? [];

    if (childIds.length === 0) {
      const center = cursor + NODE_HEIGHT / 2;
      cursor += NODE_HEIGHT + SIBLING_GAP;
      centerY.set(id, center);
      return center;
    }

    const childCenters = childIds.map((childId) => place(childId));
    cursor += BRANCH_GAP - SIBLING_GAP;

    const center = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
    centerY.set(id, center);
    return center;
  };
  rootIds.forEach((rootId) => place(rootId));

  const edges: Edge[] = graph.nodes
    .filter((node) => node.parentId && byId.has(node.parentId))
    .map((node) => ({
      id: `${node.parentId}-${node.id}`,
      source: node.parentId as string,
      target: node.id,
      type: "default",
      style: { stroke: "#d4d4d8", strokeWidth: 1.5 },
    }));

  const nodes: Node[] = graph.nodes.map((node) => {
    const depth = depthOf.get(node.id) ?? 0;

    return {
      id: node.id,
      type: "mindmap",
      data: { label: node.label, path: pathOf(node.id), isRoot: depth === 0 },
      position: {
        x: columnX[depth] ?? 0,
        y: (centerY.get(node.id) ?? 0) - NODE_HEIGHT / 2,
      },
      draggable: false,
      connectable: false,
      style: { width: columnWidth[depth] ?? estimateWidth(node.label) },
    };
  });

  return { nodes, edges };
}
