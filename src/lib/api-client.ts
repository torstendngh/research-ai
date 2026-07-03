import type { ActionResult } from "@/lib/actions/types";

/**
 * POST to an API route that responds `{ data }` on success and `{ error }`
 * with a non-2xx status on failure. Long-running work goes through these
 * routes instead of server actions, which Next.js runs serially per tab.
 */
export async function postApi<T>(
    url: string,
    body: FormData | object,
): Promise<ActionResult<T>> {
    try {
        const response = await fetch(url, {
            method: "POST",
            ...(body instanceof FormData
                ? { body }
                : {
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify(body),
                  }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            return { ok: false, error: payload?.error ?? "Request failed." };
        }

        return { ok: true, data: payload.data as T };
    } catch {
        return { ok: false, error: "Network error. Please try again." };
    }
}
