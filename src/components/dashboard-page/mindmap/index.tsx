import Window from "../window";
import MindMap from "./mindmap";

/** The mind map tab: the graph canvas inside the standard window card. */
const MindMapTab = () => (
  <Window className="flex-1">
    <MindMap />
  </Window>
);

export default MindMapTab;
