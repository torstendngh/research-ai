"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/supabase/auth";
import type { RagCitation } from "@/lib/rag";

export type Chat = {
    id: string;
    project_id: string;
    title: string;
    created_at: string;
    updated_at: string;
};

export type ChatMessage = {
    id: string;
    chat_id: string;
    role: "user" | "assistant";
    content: string;
    citations: RagCitation[] | null;
    created_at: string;
};

export type ChatBundle = {
    chat: Chat;
    project: { id: string; title: string };
    messages: ChatMessage[];
};

const CHAT_SELECT = "id, project_id, title, created_at, updated_at";
const MESSAGE_SELECT = "id, chat_id, role, content, citations, created_at";

function deriveTitle(message: string): string {
    const trimmed = message.trim().replace(/\s+/g, " ");
    if (!trimmed) return "New chat";
    return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

async function assertProjectOwnership(projectId: string, ownerId: string): Promise<void> {
    const { data, error } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("owner_id", ownerId)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Project not found.");
}

export async function listChats(projectId: string): Promise<Chat[]> {
    const ownerId = await requireUserId();

    const { data, error } = await supabaseAdmin
        .from("chats")
        .select(CHAT_SELECT)
        .eq("owner_id", ownerId)
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false });

    if (error) throw error;

    return (data ?? []) as Chat[];
}

/**
 * Create a chat and persist the first user message. The assistant reply is
 * generated (and streamed) by POST /api/chats/:chatId/messages once the chat
 * is open, which keeps the flow reload-safe.
 */
export async function createChat(
    projectId: string,
    firstMessage: string,
): Promise<{ chatId: string }> {
    const ownerId = await requireUserId();
    await assertProjectOwnership(projectId, ownerId);

    const content = firstMessage.trim();
    if (!content) throw new Error("Message is empty.");

    const { data: chat, error: chatError } = await supabaseAdmin
        .from("chats")
        .insert({
            project_id: projectId,
            owner_id: ownerId,
            title: deriveTitle(content),
        })
        .select("id")
        .single();

    if (chatError) throw chatError;

    const { error: messageError } = await supabaseAdmin
        .from("chat_messages")
        .insert({ chat_id: chat.id, role: "user", content });

    if (messageError) throw messageError;

    revalidatePath(`/dashboard/${projectId}`);

    return { chatId: chat.id as string };
}

export async function getChatBundle(chatId: string): Promise<ChatBundle | null> {
    const ownerId = await requireUserId();

    const { data: chat, error: chatError } = await supabaseAdmin
        .from("chats")
        .select(CHAT_SELECT)
        .eq("id", chatId)
        .eq("owner_id", ownerId)
        .maybeSingle();

    if (chatError) throw chatError;
    if (!chat) return null;

    const { data: project, error: projectError } = await supabaseAdmin
        .from("projects")
        .select("id, title")
        .eq("id", chat.project_id)
        .maybeSingle();

    if (projectError) throw projectError;

    const { data: messages, error: messagesError } = await supabaseAdmin
        .from("chat_messages")
        .select(MESSAGE_SELECT)
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    return {
        chat: chat as Chat,
        project: (project as { id: string; title: string }) ?? { id: chat.project_id, title: "Project" },
        messages: (messages ?? []) as ChatMessage[],
    };
}

export async function deleteChat(chatId: string): Promise<void> {
    const ownerId = await requireUserId();

    const { error } = await supabaseAdmin
        .from("chats")
        .delete()
        .eq("id", chatId)
        .eq("owner_id", ownerId);

    if (error) throw error;
}
