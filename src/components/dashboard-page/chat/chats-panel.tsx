"use client";

import { useState } from "react";
import { cn } from "@/lib/tailwind-utils";
import AddIcon from "@/components/shared/icons/add-icon";
import ChatIcon from "@/components/shared/icons/chat-icon";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import SidebarLeftIcon from "@/components/shared/icons/sidebar-left-icon";
import TrashIcon from "@/components/shared/icons/trash-icon";
import IconButton from "@/components/shared/icon-button";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import type { Chat } from "@/lib/actions/chats";
import Window from "../window";
import { useDashboard } from "../dashboard-context";

/** Vertical list of the project's chats; the active one is highlighted. */
const ChatsPanel = ({ onMinimize }: { onMinimize: () => void }) => {
  const { chats, activeChat, selectChat, newChat, removeChat, project } = useDashboard();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<Chat | null>(null);

  const handleDelete = async (chatId: string) => {
    setDeletingIds((prev) => new Set(prev).add(chatId));
    try {
      await removeChat(chatId);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });
    }
  };

  return (
    <Window
      title="Chats"
      actions={
        <>
          <IconButton label="New chat" onClick={newChat} disabled={!project}>
            <AddIcon className="size-4.5" />
          </IconButton>
          <IconButton label="Hide chats" onClick={onMinimize}>
            <SidebarLeftIcon className="size-4.5" />
          </IconButton>
        </>
      }
    >
      <ul className="flex flex-col overflow-y-auto flex-1 py-1">
        {chats.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-zinc-400">
            No chats yet. Ask your first question to start one.
          </li>
        )}

        {chats.map((chat) => {
          const isActive = activeChat?.id === chat.id;
          const isDeleting = deletingIds.has(chat.id);

          return (
            <li
              key={chat.id}
              className={cn(
                "group flex items-center gap-2 overflow-hidden px-2 mx-1 rounded-md",
                isActive ? "bg-zinc-100" : "hover:bg-zinc-100",
              )}
            >
              <button
                type="button"
                onClick={() => selectChat(chat.id)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 text-left"
              >
                <ChatIcon className="size-4 shrink-0 text-zinc-400" />
                <span className="truncate text-sm" title={chat.title}>
                  {chat.title}
                </span>
              </button>
              <IconButton
                label="Delete chat"
                onClick={() => setPendingDelete(chat)}
                disabled={isDeleting}
                className={cn(
                  "shrink-0 hover:bg-zinc-200",
                  isDeleting ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
              >
                {isDeleting ? (
                  <LoadingIcon className="size-4 animate-spin" />
                ) : (
                  <TrashIcon className="size-4" />
                )}
              </IconButton>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) return handleDelete(pendingDelete.id);
        }}
        title="Delete chat?"
        description={
          <>
            <span className="font-medium text-zinc-700">
              {pendingDelete?.title}
            </span>{" "}
            and its messages will be permanently deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete chat"
      />
    </Window>
  );
};

export default ChatsPanel;
