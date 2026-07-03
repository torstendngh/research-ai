"use client";

import SidebarLeftIcon from "@/components/shared/icons/sidebar-left-icon";
import IconButton from "@/components/shared/icon-button";
import Window from "../window";
import Prompt from "./prompt";
import Messages from "./messages";
import { useDashboard } from "../dashboard-context";
import AddIcon from "@/components/shared/icons/add-icon";
import OptionsIcon from "@/components/shared/icons/options-icon";

interface ChatProps {
  /** Set while the chats panel is hidden; renders a reopen button on the left. */
  onExpandChats?: () => void;
  /** Set while the options panel is hidden; renders a reopen button on the right. */
  onExpandOptions?: () => void;
}

const Chat = ({ onExpandChats, onExpandOptions }: ChatProps) => {
  const { activeChat, project, newChat } = useDashboard();

  return (
    <Window
      title={project ? (activeChat?.title ?? "New chat") : "Chat"}
      leading={
        onExpandChats && (
          <>
            <IconButton label="Show chats" onClick={onExpandChats}>
              <SidebarLeftIcon className="size-4.5" />
            </IconButton>
            <IconButton label="New chat" onClick={newChat} disabled={!project}>
              <AddIcon className="size-4.5" />
            </IconButton>
          </>
        )
      }
      actions={
        onExpandOptions && (
          <IconButton label="Show chat options" onClick={onExpandOptions}>
            <OptionsIcon className="size-4.5" />
          </IconButton>
        )
      }
    >
      <Messages />
      <Prompt />
    </Window>
  );
};

export default Chat;
