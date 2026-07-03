// Per-user usage limits. Plain server module (not "use server"): only called
// from auth-checked server actions and route handlers — it accepts an
// arbitrary ownerId.
//
// Counting works off the `usage_events` ledger (deleting a chat or source does
// not refund quota); storage is computed live from the byte-size columns, so
// deleting sources or podcasts frees space.

import { supabaseAdmin } from "@/lib/supabase/admin";

export type UsageKind = "chat_message" | "source_ingest" | "podcast" | "quiz_deck";

export const USAGE_LIMITS = {
    /** Assistant replies per day (resets at midnight UTC). */
    chatMessagesPerDay: 100,
    /** Source ingests per month (resets on the 1st, UTC). */
    sourcesPerMonth: 50,
    /** Podcast generations per month (resets on the 1st, UTC). */
    podcastsPerMonth: 10,
    /** Quiz deck generations per month (resets on the 1st, UTC). */
    quizDecksPerMonth: 20,
    /** Total stored content: source files/text + podcast audio. */
    storageBytes: 500 * 1024 * 1024,
} as const;

const KIND_CONFIG: Record<
    UsageKind,
    { limit: number; window: "day" | "month"; label: string }
> = {
    chat_message: {
        limit: USAGE_LIMITS.chatMessagesPerDay,
        window: "day",
        label: "chat messages",
    },
    source_ingest: {
        limit: USAGE_LIMITS.sourcesPerMonth,
        window: "month",
        label: "sources",
    },
    podcast: {
        limit: USAGE_LIMITS.podcastsPerMonth,
        window: "month",
        label: "podcast episodes",
    },
    quiz_deck: {
        limit: USAGE_LIMITS.quizDecksPerMonth,
        window: "month",
        label: "quiz decks",
    },
};

export type UsageMeter = {
    used: number;
    limit: number;
    /** ISO timestamp of when the counter resets. */
    resetsAt: string;
};

export type UsageSummary = {
    chatMessages: UsageMeter;
    sources: UsageMeter;
    podcasts: UsageMeter;
    quizDecks: UsageMeter;
    storage: {
        usedBytes: number;
        limitBytes: number;
        /** Breakdown of `usedBytes`: source files/text vs. podcast audio. */
        sourceBytes: number;
        audioBytes: number;
    };
};

export type QuotaCheck = { ok: true } | { ok: false; error: string };

function windowStart(window: "day" | "month", now = new Date()): Date {
    return window === "day"
        ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function windowReset(window: "day" | "month", now = new Date()): Date {
    return window === "day"
        ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

function resetPhrase(kind: UsageKind): string {
    return KIND_CONFIG[kind].window === "day"
        ? "resets at midnight UTC"
        : "resets on the 1st of next month";
}

async function countEvents(ownerId: string, kind: UsageKind): Promise<number> {
    const since = windowStart(KIND_CONFIG[kind].window);

    const { count, error } = await supabaseAdmin
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", ownerId)
        .eq("kind", kind)
        .gte("created_at", since.toISOString());

    if (error) throw error;

    return count ?? 0;
}

async function getStorageBreakdown(
    ownerId: string,
): Promise<{ sourceBytes: number; audioBytes: number }> {
    const [sources, podcasts] = await Promise.all([
        supabaseAdmin.from("rag_sources").select("byte_size").eq("owner_id", ownerId),
        supabaseAdmin.from("project_podcasts").select("audio_bytes").eq("owner_id", ownerId),
    ]);

    if (sources.error) throw sources.error;
    if (podcasts.error) throw podcasts.error;

    const sourceBytes = (sources.data ?? []).reduce(
        (sum, row) => sum + Number(row.byte_size ?? 0),
        0,
    );
    const audioBytes = (podcasts.data ?? []).reduce(
        (sum, row) => sum + Number(row.audio_bytes ?? 0),
        0,
    );

    return { sourceBytes, audioBytes };
}

export async function getStorageUsedBytes(ownerId: string): Promise<number> {
    const { sourceBytes, audioBytes } = await getStorageBreakdown(ownerId);
    return sourceBytes + audioBytes;
}

export async function getUsageSummary(ownerId: string): Promise<UsageSummary> {
    const [chatUsed, sourcesUsed, podcastsUsed, quizDecksUsed, storage] = await Promise.all([
        countEvents(ownerId, "chat_message"),
        countEvents(ownerId, "source_ingest"),
        countEvents(ownerId, "podcast"),
        countEvents(ownerId, "quiz_deck"),
        getStorageBreakdown(ownerId),
    ]);

    const meter = (kind: UsageKind, used: number): UsageMeter => ({
        used,
        limit: KIND_CONFIG[kind].limit,
        resetsAt: windowReset(KIND_CONFIG[kind].window).toISOString(),
    });

    return {
        chatMessages: meter("chat_message", chatUsed),
        sources: meter("source_ingest", sourcesUsed),
        podcasts: meter("podcast", podcastsUsed),
        quizDecks: meter("quiz_deck", quizDecksUsed),
        storage: {
            usedBytes: storage.sourceBytes + storage.audioBytes,
            limitBytes: USAGE_LIMITS.storageBytes,
            sourceBytes: storage.sourceBytes,
            audioBytes: storage.audioBytes,
        },
    };
}

/** Is another `kind` action allowed right now? Friendly error when not. */
export async function checkQuota(ownerId: string, kind: UsageKind): Promise<QuotaCheck> {
    const config = KIND_CONFIG[kind];
    const used = await countEvents(ownerId, kind);

    if (used < config.limit) return { ok: true };

    const period = config.window === "day" ? "Daily" : "Monthly";
    return {
        ok: false,
        error: `${period} limit reached (${config.limit} ${config.label}) — ${resetPhrase(kind)}.`,
    };
}

/** Would storing `incomingBytes` more stay within the storage cap? */
export async function checkStorage(ownerId: string, incomingBytes = 0): Promise<QuotaCheck> {
    const used = await getStorageUsedBytes(ownerId);

    if (used + incomingBytes <= USAGE_LIMITS.storageBytes) return { ok: true };

    const limitMb = Math.round(USAGE_LIMITS.storageBytes / (1024 * 1024));
    return {
        ok: false,
        error: `Storage limit reached (${limitMb} MB). Delete sources or podcast episodes to free up space.`,
    };
}

/**
 * Record one countable action. Failures are logged but never thrown: a broken
 * ledger write must not fail the user-visible action it accounts for.
 */
export async function recordUsage(ownerId: string, kind: UsageKind): Promise<void> {
    const { error } = await supabaseAdmin
        .from("usage_events")
        .insert({ owner_id: ownerId, kind });

    if (error) console.error("Failed to record usage event:", error);
}
