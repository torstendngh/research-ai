import type { PromptContextChip } from "./dashboard-context";

export function pathLabel(path: string[]) {
  return path.join(" > ");
}

export function mindmapChip(path: string[]): PromptContextChip {
  const label = pathLabel(path);
  return {
    id: `mindmap:${label}`,
    source: "mindmap",
    label,
    path,
  };
}

function chipLines(chips: PromptContextChip[]) {
  return chips.map((chip) => `- ${chip.label}`).join("\n");
}

export function buildChatPrompt(draft: string, chips: PromptContextChip[]) {
  const trimmed = draft.trim();
  if (chips.length === 0) return trimmed;

  const context = `Use these mind-map selections as context:\n${chipLines(chips)}`;
  if (!trimmed) return `Tell me more about these mind-map selections:\n${chipLines(chips)}`;
  return `${trimmed}\n\n${context}`;
}

export function buildPodcastPrompt(draft: string, chips: PromptContextChip[]) {
  const trimmed = draft.trim();
  if (chips.length === 0) return trimmed;

  const context = `Mind-map selections to cover:\n${chipLines(chips)}`;
  if (!trimmed) return `Create a podcast episode about these mind-map selections:\n${chipLines(chips)}`;
  return `${trimmed}\n\n${context}`;
}

export function buildQuizPrompt(draft: string, chips: PromptContextChip[]) {
  const trimmed = draft.trim();
  if (chips.length === 0) return trimmed;

  const context = `Mind-map selections to cover:\n${chipLines(chips)}`;
  if (!trimmed) return `Create quiz cards about these mind-map selections:\n${chipLines(chips)}`;
  return `${trimmed}\n\n${context}`;
}
