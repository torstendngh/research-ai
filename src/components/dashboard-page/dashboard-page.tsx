import TabBar from "./tab-bar";
import MainView from "./main-view";
import { DashboardProvider } from "./dashboard-context";
import type { MainTab } from "./dashboard-context";
import type { Project } from "@/lib/actions/projects";
import type { Source } from "@/lib/actions/sources";
import type { Chat as ChatType } from "@/lib/actions/chats";

interface DashboardPageProps {
  project: Project | null;
  sources: Source[];
  chats: ChatType[];
  /** Tab to open, resolved from the URL by the route. Defaults per project. */
  initialTab?: MainTab;
}

/** Per-project dashboard content; the navbar chrome lives in the route layout. */
const DashboardPage = ({
  project,
  sources,
  chats,
  initialTab,
}: DashboardPageProps) => {
  return (
    <DashboardProvider
      project={project}
      sources={sources}
      chats={chats}
      initialTab={initialTab}
    >
      <TabBar />
      <MainView />
    </DashboardProvider>
  );
};

export default DashboardPage;
