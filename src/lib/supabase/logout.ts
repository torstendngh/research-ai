import { createClient } from "@/lib/supabase/client";

const logout = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Sign-out failed:", error.message);
        return;
    }

    window.location.href = "/login";
};

export default logout;
