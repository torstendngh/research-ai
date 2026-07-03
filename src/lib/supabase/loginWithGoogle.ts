import { createClient } from "@/lib/supabase/client";

const loginWithGoogle = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
    });

    if (error) {
        console.error("Google sign-in failed:", error.message);
    }
};

export default loginWithGoogle;
