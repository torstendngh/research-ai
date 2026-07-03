// English prose averages ~4 characters per token. Word counts alone wildly
// underestimate text without spaces (CJK, long URLs, base64), so estimates
// take the larger of the word- and character-based figures, and the slicing
// helpers enforce a character cap after slicing by words.
const CHARS_PER_TOKEN = 4;

export const takeFirstApproxTokens = (text: string, tokenCount: number): string => {
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = Math.floor(tokenCount * 0.75);
    const sliced = words.slice(0, wordCount).join(" ");
    const maxChars = tokenCount * CHARS_PER_TOKEN;

    return sliced.length > maxChars ? sliced.slice(0, maxChars) : sliced;
}

export const takeLastApproxTokens = (text: string, tokenCount: number): string => {
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = Math.floor(tokenCount * 0.75);
    const sliced = words.slice(Math.max(0, words.length - wordCount)).join(" ");
    const maxChars = tokenCount * CHARS_PER_TOKEN;

    return sliced.length > maxChars ? sliced.slice(sliced.length - maxChars) : sliced;
}

export const roughTokenCount = (text: string): number => {
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.ceil(Math.max(words / 0.75, text.length / CHARS_PER_TOKEN));
}
