"use client";

import { useCallback, useState } from "react";
import type { Project } from "@/lib/actions/projects";
import {
  createChat,
  deleteChat as deleteChatAction,
  getChatBundle,
  type Chat,
  type ChatMessage,
} from "@/lib/actions/chats";
import type { RagCitation } from "@/lib/rag/types";

function deriveTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

/**
 * Chat client state: the project's chats, the open chat's messages, and the
 * send/stream round-trip against the messages route.
 */
export function useChats(initialChats: Chat[], ensureProject: () => Promise<Project>) {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Waiting for the first token — drives the "thinking" dots.
  const [isThinking, setIsThinking] = useState<boolean>(false);
  // A reply round-trip is in flight (thinking or streaming) — blocks sends.
  const [isResponding, setIsResponding] = useState<boolean>(false);

  const newChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
  }, []);

  const selectChat = useCallback(
    async (chatId: string) => {
      setActiveChat(chats.find((c) => c.id === chatId) ?? null);
      setMessages([]);
      const bundle = await getChatBundle(chatId);
      if (bundle) {
        setActiveChat(bundle.chat);
        setMessages(bundle.messages);
      }
    },
    [chats],
  );

  const removeChat = useCallback(
    async (chatId: string) => {
      await deleteChatAction(chatId);
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (activeChat?.id === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
    },
    [activeChat],
  );

  /**
   * Request the assistant reply from the streaming route and render it as it
   * arrives. The route sends newline-delimited JSON events: `citations` (after
   * retrieval), `delta` (answer text), `done` (the persisted message), `error`.
   */
  const runAssistant = useCallback(async (chatId: string, content?: string) => {
    setIsThinking(true);
    setIsResponding(true);

    // The in-progress reply lives in `messages` under this temporary id until
    // the `done` event swaps in the persisted message from the server.
    const streamingId = `streaming-${Date.now()}`;
    let citations: RagCitation[] | null = null;

    const appendDelta = (text: string) => {
      setIsThinking(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === streamingId) {
          return [...prev.slice(0, -1), { ...last, content: last.content + text }];
        }
        return [
          ...prev,
          {
            id: streamingId,
            chat_id: chatId,
            role: "assistant" as const,
            content: text,
            citations,
            created_at: new Date().toISOString(),
          },
        ];
      });
    };

    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(content ? { content } : {}),
      });

      if (!response.ok || !response.body) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error ?? "Failed to send message.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffered = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffered += decoder.decode(value, { stream: true });
        const lines = buffered.split("\n");
        buffered = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);

          if (event.type === "citations") {
            citations = event.citations as RagCitation[];
          } else if (event.type === "delta") {
            appendDelta(event.text as string);
          } else if (event.type === "done") {
            const message = event.message as ChatMessage;
            setMessages((prev) =>
              prev.some((m) => m.id === streamingId)
                ? prev.map((m) => (m.id === streamingId ? message : m))
                : [...prev, message],
            );
          } else if (event.type === "error") {
            throw new Error(event.error as string);
          }
        }
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Failed to send message.";
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== streamingId),
        {
          id: `error-${Date.now()}`,
          chat_id: chatId,
          role: "assistant" as const,
          content: `Something went wrong: ${detail}`,
          citations: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsThinking(false);
      setIsResponding(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || isResponding) return;
      const targetProject = await ensureProject();

      const optimistic: ChatMessage = {
        id: `temp-${Date.now()}`,
        chat_id: activeChat?.id ?? "pending",
        role: "user",
        content,
        citations: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      if (activeChat) {
        await runAssistant(activeChat.id, content);
        return;
      }

      // No active chat: create one (this also persists the first user message),
      // then generate the assistant reply for that pending turn.
      const now = new Date().toISOString();
      const { chatId } = await createChat(targetProject.id, content);
      const created: Chat = {
        id: chatId,
        project_id: targetProject.id,
        title: deriveTitle(content),
        created_at: now,
        updated_at: now,
      };
      setActiveChat(created);
      setChats((prev) => [created, ...prev]);
      await runAssistant(chatId);
    },
    [activeChat, ensureProject, isResponding, runAssistant],
  );

  // Called (during render) when navigating to a different project. A plain
  // function so it always captures the current render's `initialChats`.
  const reset = () => {
    setChats(initialChats);
    setActiveChat(null);
    setMessages([]);
    setIsThinking(false);
    setIsResponding(false);
  };

  return {
    chats,
    activeChat,
    messages,
    isThinking,
    isResponding,
    newChat,
    selectChat,
    removeChat,
    sendMessage,
    reset,
  };
}
