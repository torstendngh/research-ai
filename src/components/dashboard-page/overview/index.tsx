import Window from "../window";
import Overview from "./overview";

/** The overview tab: the project hero + description inside the standard window card. */
const OverviewTab = () => (
  <Window className="flex-1">
    <Overview />
  </Window>
);

export default OverviewTab;
