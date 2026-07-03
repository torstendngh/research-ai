import type { ReactNode } from "react";

/** Loading / error / empty states, centered over the canvas area. */
const CenteredMessage = ({ children }: { children: ReactNode }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
    {children}
  </div>
);

export default CenteredMessage;
