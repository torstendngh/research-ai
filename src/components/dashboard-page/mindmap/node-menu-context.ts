"use client";

import { createContext } from "react";

export type NodeMenuHandlers = {
  ask: (path: string[]) => void;
  podcast: (path: string[]) => void;
  quiz: (path: string[]) => void;
};

// Lets the custom node reach the latest menu handlers at click time without
// the layout function (run during render) having to depend on them.
export const NodeMenuContext = createContext<NodeMenuHandlers>({
  ask: () => {},
  podcast: () => {},
  quiz: () => {},
});
