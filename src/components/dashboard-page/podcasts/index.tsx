import Window from "../window";
import Podcasts from "./podcasts";

/** The podcasts tab: episode list + generator inside the standard window card. */
const PodcastsTab = () => (
  <Window className="flex-1">
    <Podcasts />
  </Window>
);

export default PodcastsTab;
