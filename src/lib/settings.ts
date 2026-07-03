// Shared user-settings primitives. Kept free of "use server" / server-only
// imports so both the client UI (Options panel) and the server RAG layer can
// import the response-length presets from one place.

export type ResponseLength = "short" | "balanced" | "detailed";

export const DEFAULT_RESPONSE_LENGTH: ResponseLength = "balanced";

export const RESPONSE_LENGTHS: {
    id: ResponseLength;
    label: string;
    description: string;
}[] = [
    { id: "short", label: "Short", description: "A few sentences." },
    { id: "balanced", label: "Balanced", description: "A focused answer." },
    { id: "detailed", label: "Detailed", description: "Thorough, with specifics." },
];

export function isResponseLength(value: unknown): value is ResponseLength {
    return value === "short" || value === "balanced" || value === "detailed";
}

// How each preset shapes the answer model. The prose directive does the real
// shaping; the token cap is a generous guardrail against runaway answers (kept
// high so reasoning models don't get truncated into empty output).
export const RESPONSE_LENGTH_DIRECTIVE: Record<ResponseLength, string | null> = {
    short: "Keep the answer brief: at most a few sentences covering only the essential points.",
    balanced: null,
    detailed:
        "Give a thorough, well-structured answer. Explain the relevant details and include supporting specifics from the sources.",
};

export const RESPONSE_LENGTH_MAX_TOKENS: Record<ResponseLength, number> = {
    short: 800,
    balanced: 1600,
    detailed: 3200,
};
