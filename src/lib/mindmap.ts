// Shared mind-map shapes. Kept free of server-only imports so both the client
// (React Flow renderer) and the server (generation + persistence) can use them.

export type MindmapNode = {
    id: string;
    label: string;
    /** The parent node's id, or null for a root node. */
    parentId: string | null;
};

export type MindmapGraph = {
    title: string;
    nodes: MindmapNode[];
};

export const EMPTY_MINDMAP: MindmapGraph = { title: "", nodes: [] };
