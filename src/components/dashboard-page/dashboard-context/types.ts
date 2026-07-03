/**
 * A source that is still being ingested (or failed to). It only lives in
 * client state: once ingestion succeeds and the refreshed server list contains
 * the real source row, the pending entry is dropped.
 */
export type PendingSource = {
  id: string;
  kind: "pdf" | "url" | "text";
  title: string;
  status: "processing" | "failed";
  /**
   * The project this pending source belongs to. `null` while it was staged on
   * the draft (unsaved) project and the real project id isn't known yet; set to
   * the real id once the project is ensured. The pending store lives above the
   * route, so this is how each project's page shows only its own pending rows.
   */
  projectId: string | null;
  /** Set once ingestion succeeds; used to match the entry against `sources`. */
  sourceId?: string;
  error?: string;
};

/** A source the user staged for ingestion (add-sources dialog, drag-drop, discovery). */
export type NewSourceInput =
  | { kind: "url"; url: string }
  | { kind: "pdf"; file: File }
  | { kind: "text"; title: string; text: string };

export type MainTab =
  | "overview"
  | "sources"
  | "chat"
  | "mindMap"
  | "podcasts"
  | "quizCards"
  | "options";

export type PromptContextChip = {
  id: string;
  source: "mindmap";
  label: string;
  path: string[];
};

/**
 * A prompt draft plus its mind-map context chips, shared through the dashboard
 * context so other panels can compose (but not send) a message. The chat,
 * podcast, and quiz tabs each get their own instance. `focusNonce` bumps
 * whenever something fills the prompt so the input can focus itself.
 */
export interface PromptControls {
  draft: string;
  setDraft: (value: string) => void;
  fill: (value: string) => void;
  focusNonce: number;
  chips: PromptContextChip[];
  addChip: (chip: PromptContextChip) => void;
  removeChip: (id: string) => void;
  clearChips: () => void;
}
