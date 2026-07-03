"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/shared/resizable";
import Chat from "./chat";
import ChatsPanel from "./chats-panel";
import ChatOptionsPanel from "./chat-options-panel";

/**
 * The chat tab: chats list (minimizable) — the chat itself — chat options
 * (minimizable). A hidden side panel leaves a reopen button on its side of the
 * chat header. Panels are conditionally mounted, so stable `id`s keep the
 * resize layout stable.
 */
const ChatLayout = () => {
  const [showChats, setShowChats] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="flex flex-1 min-w-0 gap-2">
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {showChats && (
          <>
            <ResizablePanel
              id="chats"
              defaultSize="256px"
              minSize="150px"
              maxSize="40%"
            >
              <ChatsPanel onMinimize={() => setShowChats(false)} />
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}

        {/* 1 : 2 : 1 by default — an explicit size keeps the middle panel from
            claiming all the leftover space and crushing the sides. Careful:
            react-resizable-panels v4 reads bare numbers as pixels, so sizes
            must carry a unit. */}
        <ResizablePanel id="chat" minSize="30%">
          <Chat
            onExpandChats={showChats ? undefined : () => setShowChats(true)}
            onExpandOptions={
              showOptions ? undefined : () => setShowOptions(true)
            }
          />
        </ResizablePanel>

        {showOptions && (
          <>
            <ResizableHandle />
            <ResizablePanel
              id="chat-options"
              defaultSize="256px"
              minSize="150px"
              maxSize="40%"
            >
              <ChatOptionsPanel onMinimize={() => setShowOptions(false)} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default ChatLayout;
