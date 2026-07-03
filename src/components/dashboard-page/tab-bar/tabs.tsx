import CardsIcon from "@/components/shared/icons/cards-icon";
import ChatIcon from "@/components/shared/icons/chat-icon";
import HomeIcon from "@/components/shared/icons/home-icon";
import MindMapIcon from "@/components/shared/icons/mind-map-icon";
import OptionsIcon from "@/components/shared/icons/options-icon";
import SourcesIcon from "@/components/shared/icons/sources-icon";
import { ReactNode } from "react";
import type { MainTab } from "../dashboard-context";
import PodcastIcon from "@/components/shared/icons/podcast-icon";

interface Tab {
  id: MainTab;
  title: string;
  icon?: ReactNode;
}

const tabs: Tab[] = [
  {
    id: "sources",
    title: "Sources",
    icon: <SourcesIcon />,
  },
  {
    id: "overview",
    title: "Overview",
    icon: <HomeIcon />,
  },
  {
    id: "chat",
    title: "Chat",
    icon: <ChatIcon />,
  },
  {
    id: "mindMap",
    title: "Mind Map",
    icon: <MindMapIcon />,
  },
  {
    id: "podcasts",
    title: "Podcasts",
    icon: <PodcastIcon />,
  },
  {
    id: "quizCards",
    title: "Quiz Cards",
    icon: <CardsIcon />,
  },
  {
    id: "options",
    title: "Options",
    icon: <OptionsIcon />,
  },
];

export default tabs;
