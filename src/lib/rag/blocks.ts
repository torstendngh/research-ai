import type { TextBlock } from "./types";

export function blocksFromMarkdown(markdown: string): TextBlock[] {
    const blocks: TextBlock[] = [];
    const lines = markdown.split(/\r?\n/);
    let paragraph: string[] = [];
    let table: string[] = [];

    const flushParagraph = () => {
        if (paragraph.length === 0) return;

        blocks.push({
            type: "paragraph",
            text: paragraph.join(" ").trim(),
        });

        paragraph = [];
    };

    const flushTable = () => {
        if (table.length === 0) return;

        blocks.push({
            type: "table",
            text: table.join("\n").trim(),
        });

        table = [];
    };

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            flushParagraph();
            flushTable();
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

        if (headingMatch) {
            flushParagraph();
            flushTable();

            blocks.push({
                type: "heading",
                level: headingMatch[1].length,
                text: headingMatch[2].trim(),
            });

            continue;
        }

        if (trimmed.includes("|") && trimmed.length >= 3) {
            flushParagraph();
            table.push(trimmed);
            continue;
        }

        if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
            flushParagraph();

            blocks.push({
                type: "list",
                text: trimmed,
            });

            continue;
        }

        flushTable();
        paragraph.push(trimmed);
    }

    flushParagraph();
    flushTable();

    return blocks;
}

export function blocksFromPlainText(text: string, page?: number): TextBlock[] {
    const blocks: TextBlock[] = [];
    const lines = text.split(/\r?\n/);
    let paragraph: string[] = [];

    const flushParagraph = () => {
        if (paragraph.length === 0) return;

        blocks.push({
            type: "paragraph",
            text: paragraph.join(" ").trim(),
            page,
        });

        paragraph = [];
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            flushParagraph();
            continue;
        }

        if (isLikelyHeading(trimmed)) {
            flushParagraph();

            blocks.push({
                type: "heading",
                text: trimmed,
                level: detectHeadingLevel(trimmed),
                page,
            });

            continue;
        }

        paragraph.push(trimmed);
    }

    flushParagraph();

    return blocks;
}

function isLikelyHeading(line: string): boolean {
    if (line.length < 4 || line.length > 120) return false;
    if (line.endsWith(".") || line.endsWith(",") || line.endsWith(";")) return false;
    if (/^\d+(\.\d+)*\s+\S+/.test(line)) return true;
    if (/^(abstract|introduction|summary|overview|conclusion|references|appendix)$/i.test(line)) return true;

    const hasLetters = /[a-zA-ZÄÖÜäöüß]/.test(line);
    const isMostlyUppercase = line === line.toUpperCase();

    return hasLetters && isMostlyUppercase;
}

function detectHeadingLevel(line: string): number {
    if (/^\d+\s+\S+/.test(line)) return 1;
    if (/^\d+\.\d+\s+\S+/.test(line)) return 2;
    if (/^\d+\.\d+\.\d+\s+\S+/.test(line)) return 3;
    return 2;
}
