import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve the currently authenticated user's id from the SSR Supabase client.
 * Returns null when there is no session. Protected routes are already guarded by
 * the middleware in `src/lib/supabase/middleware.ts`.
 */
export async function getCurrentUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
}

/**
 * Like `getCurrentUserId`, but throws when unauthenticated. Use inside server
 * actions that must have an owner.
 */
export async function requireUserId(): Promise<string> {
    const userId = await getCurrentUserId();

    if (!userId) {
        throw new Error("Not authenticated.");
    }

    return userId;
}
