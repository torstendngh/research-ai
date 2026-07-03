"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/supabase/auth";

/** Read the current user's custom AI instructions ("" when none saved). */
export async function getInstructions(): Promise<string> {
    const ownerId = await requireUserId();

    const { data, error } = await supabaseAdmin
        .from("user_settings")
        .select("instructions")
        .eq("owner_id", ownerId)
        .maybeSingle();

    if (error) throw error;

    return (data?.instructions as string) ?? "";
}

/** Save (upsert) the current user's custom AI instructions. */
export async function saveInstructions(instructions: string): Promise<void> {
    const ownerId = await requireUserId();

    const { error } = await supabaseAdmin
        .from("user_settings")
        .upsert(
            {
                owner_id: ownerId,
                instructions: instructions.trim(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "owner_id" },
        );

    if (error) throw error;
}
