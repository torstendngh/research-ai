"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { Project } from "@/lib/actions/projects";
import type { Source } from "@/lib/actions/sources";
import type { Chat, ChatMessage } from "@/lib/actions/chats";
import type {
  MainTab,
  NewSourceInput,
  PendingSource,
  PromptControls,
} from "./types";
import { TAB_TO_SLUG } from "./tabs";
import { useChats } from "./use-chats";
import { useDraftProject } from "./use-draft-project";
import {
  usePendingSourcesStore,
  useProjectPendingSources,
} from "./pending-sources-store";
import { usePromptControls } from "./use-prompt-controls";

export type {
  MainTab,
  NewSourceInput,
  PendingSource,
  PromptContextChip,
  PromptControls,
} from "./types";

interface DashboardContextValue {
  // Layout
  mainTab: MainTab;
  setMainTab: (tab: MainTab) => void;

  // Server data (route driven)
  project: Project | null;
  isDraftProject: boolean;
  ensureProject: () => Promise<Project>;
  sources: Source[];

  // Source ingestion (runs in the background; list shows progress).
  // Batches ingest in parallel and regenerate project meta once at the end.
  pendingSources: PendingSource[];
  addSources: (inputs: NewSourceInput[]) => void;
  dismissPendingSource: (id: string) => void;

  // Chat (client state)
  chats: Chat[];
  activeChat: Chat | null;
  messages: ChatMessage[];
  /** Waiting for the first token — drives the "thinking" dots. */
  isThinking: boolean;
  /** A reply round-trip is in flight (thinking or streaming) — blocks sends. */
  isResponding: boolean;
  newChat: () => void;
  selectChat: (chatId: string) => void;
  removeChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string) => void;

  // Prompt drafts, shared so other panels can compose a message without
  // sending it (e.g. a mind-map node prefilling the chat/podcast/quiz prompt).
  chatPrompt: PromptControls;
  podcastPrompt: PromptControls;
  quizPrompt: PromptControls;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  children?: ReactNode;
  project: Project | null;
  sources: Source[];
  chats: Chat[];
  /** Tab to open initially (resolved from the URL by the route). */
  initialTab?: MainTab;
}

function defaultTabFor(sources: Source[]): MainTab {
  return sources.length === 0 ? "sources" : "overview";
}

export const DashboardProvider = ({
  children,
  project,
  sources,
  chats: initialChats,
  initialTab,
}: DashboardProviderProps) => {
  const pathname = usePathname();
  const [mainTab, setMainTab] = useState<MainTab>(
    () => initialTab ?? defaultTabFor(sources),
  );

  // Mirror the open tab into the URL (`?tab=<slug>`) so it can be shared,
  // bookmarked, and restored on reload. A shallow history update keeps this
  // client-only — it never re-runs the route's server data fetch.
  useEffect(() => {
    const url = `${pathname}?tab=${TAB_TO_SLUG[mainTab]}`;
    window.history.replaceState(window.history.state, "", url);
  }, [mainTab, pathname]);

  const draft = useDraftProject(project);
  const chat = useChats(initialChats, draft.ensureProject);
  const prompt = usePromptControls();
  const podcastPrompt = usePromptControls();
  const quizPrompt = usePromptControls();

  // Source ingestion state lives above the route (in the dashboard layout) so
  // it survives the `/dashboard` → `/dashboard/[id]` remount on project
  // creation. Here we just select the rows for the project on screen.
  const persistedProjectId = project?.id ?? null;
  const pendingStore = usePendingSourcesStore();
  const pendingSources = useProjectPendingSources(sources, persistedProjectId);
  const addSources = useCallback(
    (inputs: NewSourceInput[]) => pendingStore.addSources(inputs, draft.ensureProject),
    [pendingStore, draft.ensureProject],
  );

  // Reset client state whenever we navigate to a different project. Refreshing
  // the same project (e.g. after adding a source) keeps the open chat untouched.
  // Done during render (not in an effect) so it happens before paint.
  const [trackedProjectId, setTrackedProjectId] = useState(persistedProjectId);
  if (persistedProjectId !== trackedProjectId) {
    setTrackedProjectId(persistedProjectId);
    setMainTab(defaultTabFor(sources));
    draft.reset();
    chat.reset();
    prompt.reset();
    podcastPrompt.reset();
    quizPrompt.reset();
  }
  if (sources.length === 0 && mainTab !== "sources") {
    setMainTab("sources");
  }

  return (
    <DashboardContext.Provider
      value={{
        mainTab,
        setMainTab,
        project: draft.currentProject,
        isDraftProject: draft.isDraftProject,
        ensureProject: draft.ensureProject,
        sources,
        pendingSources,
        addSources,
        dismissPendingSource: pendingStore.dismissPendingSource,
        chats: chat.chats,
        activeChat: chat.activeChat,
        messages: chat.messages,
        isThinking: chat.isThinking,
        isResponding: chat.isResponding,
        newChat: chat.newChat,
        selectChat: chat.selectChat,
        removeChat: chat.removeChat,
        sendMessage: chat.sendMessage,
        chatPrompt: prompt,
        podcastPrompt,
        quizPrompt,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
