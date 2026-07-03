"use client";

import ChatLayout from "./chat";
import Overview from "./overview";
import Sources from "./sources";
import MindMap from "./mindmap";
import Podcasts from "./podcasts";
import QuizCards from "./quiz-cards";
import ProjectOptions from "./options";
import { useDashboard } from "./dashboard-context";

/** Renders whichever main tab is active; each view fills the whole area. */
const MainView = () => {
  const { mainTab } = useDashboard();

  return (
    <div className="flex flex-1 min-h-0">
      {mainTab === "sources" && <Sources />}
      {mainTab === "overview" && <Overview />}
      {mainTab === "chat" && <ChatLayout />}
      {mainTab === "mindMap" && <MindMap />}
      {mainTab === "podcasts" && <Podcasts />}
      {mainTab === "quizCards" && <QuizCards />}
      {mainTab === "options" && <ProjectOptions />}
    </div>
  );
};

export default MainView;
