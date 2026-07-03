"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/supabase/auth";
import { getUsageSummary, type UsageSummary } from "@/lib/usage";

export type AccountOverview = {
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
    usage: UsageSummary;
};

export async function getAccountOverview(): Promise<AccountOverview> {
    const ownerId = await requireUserId();

    const [{ data: userData }, usage] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(ownerId),
        getUsageSummary(ownerId),
    ]);

    const user = userData?.user;
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;

    return {
        email: user?.email ?? null,
        name:
            (metadata.full_name as string | undefined) ??
            (metadata.name as string | undefined) ??
            null,
        avatarUrl: (metadata.avatar_url as string | undefined) ?? null,
        usage,
    };
}

/**
 * Permanently delete the current user's account: podcast audio in storage
 * first (storage objects don't cascade), then the auth user — every table's
 * owner_id references auth.users with on delete cascade, so all rows go with
 * it. The caller signs out client-side afterwards.
 */
export async function deleteAccount(): Promise<void> {
    const ownerId = await requireUserId();

    const { data: podcastRows, error: podcastsError } = await supabaseAdmin
        .from("project_podcasts")
        .select("audio_path")
        .eq("owner_id", ownerId);

    if (podcastsError) throw podcastsError;

    const audioPaths = (podcastRows ?? [])
        .map((row) => row.audio_path as string)
        .filter(Boolean);

    if (audioPaths.length > 0) {
        // Best effort — an orphaned object is harmless.
        for (let i = 0; i < audioPaths.length; i += 100) {
            await supabaseAdmin.storage.from("podcasts").remove(audioPaths.slice(i, i + 100));
        }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(ownerId);
    if (error) throw error;
}
