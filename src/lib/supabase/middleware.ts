import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Routes that require an authenticated user.
const PROTECTED_PREFIXES = ["/dashboard", "/chat"];

// Routes a signed-in user should be redirected away from (e.g. login).
const AUTH_PREFIXES = ["/login"];

export const updateSession = async (request: NextRequest) => {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value),
                );
                supabaseResponse = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options),
                );
            },
        },
    });

    // IMPORTANT: do not run code between createServerClient and getUser().
    // getUser() refreshes the auth token and lets the cookies above be written
    // back onto the response.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const requiresAuth = PROTECTED_PREFIXES.some((prefix) =>
        request.nextUrl.pathname.startsWith(prefix),
    );

    if (!user && requiresAuth) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    const isAuthRoute = AUTH_PREFIXES.some((prefix) =>
        request.nextUrl.pathname.startsWith(prefix),
    );

    if (user && isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
};
