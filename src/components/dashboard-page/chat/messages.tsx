"use client";

import { useEffect, useRef } from "react";
import { useDashboard } from "../dashboard-context";
import EmptyState from "./empty-state";
import Message from "./message";
import Thinking from "./thinking";

const Messages = () => {
  const { messages, isThinking, activeChat, project } = useDashboard();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  if (!project) {
    return <EmptyState>Create or select a project to start chatting.</EmptyState>;
  }

  if (messages.length === 0 && !isThinking) {
    return (
      <EmptyState>
        {activeChat ? "No messages in this chat yet." : "Start a new chat below."}
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-6 max-w-3xl w-full mx-auto p-4">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {isThinking && <Thinking />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Messages;
