"use client";

import { cn } from "@/lib/tailwind-utils";
import { AnimatePresence, motion } from "motion/react";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { Button } from "@/components/shared/button";
import IconButton from "@/components/shared/icon-button";
import CloseIcon from "@/components/shared/icons/close-icon";
import ChevronDownIcon from "@/components/shared/icons/chevron-down-icon";
import InstructionsIcon from "@/components/shared/icons/instructions-icon";
import UploadIcon from "@/components/shared/icons/upload-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shared/dropdown-menu";
import type { DiscoveredSource } from "@/lib/rag/discover";
import { useDashboard } from "../dashboard-context";
import { hasFiles } from "./source-utils";
import DiscoveryPanel from "./discovery-panel";
import SourceInput, { looksLikeUrl } from "./source-input";
import StagedSourceList from "./staged-source-list";
import TextForm from "./text-form";
import { useSourceDiscovery } from "./use-source-discovery";
import {
  estimateBatchLabel,
  stagedId,
  stagedWarning,
  type StagedSource,
} from "./staged-source";

/** Lets the sources page stage PDFs dropped outside the dialog. */
export interface AddSourceDialogHandle {
  stageFiles: (files: File[]) => void;
}

interface AddSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ref?: Ref<AddSourceDialogHandle>;
}

/**
 * The single place sources come from. The staged batch fills the dialog; the
 * bottom bar holds an Upload menu (PDFs / pasted text) and one input that
 * either stages a pasted link directly or asks AI to find sources on a topic
 * (suggestions float above the bar). Dropping PDFs anywhere stages them too.
 * Confirming hands the whole batch to the dashboard context: it ingests in
 * parallel in the background and the project metadata generates once at the
 * end.
 */
const AddSourceDialog = ({ isOpen, onClose, ref }: AddSourceDialogProps) => {
  const { addSources, project } = useDashboard();

  const [staged, setStaged] = useState<StagedSource[]>([]);
  const [query, setQuery] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Floating "write or paste text" panel (from the Upload menu). When a
  // staged text item is clicked, the panel reopens on it for editing.
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textTitle, setTextTitle] = useState("");
  const [textBody, setTextBody] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const discovery = useSourceDiscovery(project?.id ?? null);

  // Depth counter because dragenter/dragleave also fire for children.
  const [dragDepth, setDragDepth] = useState(0);
  const isDraggingOver = dragDepth > 0;

  const closeTextPanel = () => {
    setIsTextOpen(false);
    setEditingTextId(null);
    setTextTitle("");
    setTextBody("");
  };

  const close = () => {
    setStaged([]);
    setQuery("");
    setInputError(null);
    closeTextPanel();
    setDragDepth(0);
    discovery.reset();
    onClose();
  };

  const stageUrl = (raw: string) => {
    // Be forgiving about missing protocols — "example.com/article" is a URL.
    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
      ? raw
      : `https://${raw}`;

    if (staged.some((item) => item.kind === "url" && item.url === candidate)) {
      setInputError("That link is already in the batch.");
      return;
    }

    setStaged((prev) => [
      ...prev,
      { id: stagedId(), kind: "url", url: candidate },
    ]);
    setQuery("");
    setInputError(null);
  };

  /** Links stage directly; anything else is a topic for AI discovery. */
  const submitQuery = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setInputError(null);
    if (looksLikeUrl(trimmed)) {
      stageUrl(trimmed);
    } else {
      setIsTextOpen(false);
      void discovery.discover(trimmed).then((ok) => {
        if (ok) setQuery("");
      });
    }
  };

  const stageFiles = (files: FileList | File[]) => {
    const pdfs = Array.from(files)
      .filter(
        (file) =>
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"),
      )
      .map((file): StagedSource => ({ id: stagedId(), kind: "pdf", file }));

    if (pdfs.length > 0) setStaged((prev) => [...prev, ...pdfs]);
  };

  // PDFs dropped on the sources page get staged here, so every add path runs
  // through the same batch (warnings, estimate, one meta generation).
  useImperativeHandle(ref, () => ({ stageFiles }));

  const stageText = () => {
    const text = textBody.trim();
    if (!text) return;

    const title = textTitle.trim() || "Pasted text";
    if (editingTextId) {
      setStaged((prev) =>
        prev.map((item) =>
          item.id === editingTextId && item.kind === "text"
            ? { ...item, title, text }
            : item,
        ),
      );
    } else {
      setStaged((prev) => [
        ...prev,
        { id: stagedId(), kind: "text", title, text },
      ]);
    }
    closeTextPanel();
  };

  /** Reopen a staged text item in the floating panel for editing. */
  const editStagedText = (item: StagedSource) => {
    if (item.kind !== "text") return;
    discovery.dismiss();
    setEditingTextId(item.id);
    setTextTitle(item.title === "Pasted text" ? "" : item.title);
    setTextBody(item.text);
    setIsTextOpen(true);
  };

  // URLs already in the batch — disables their Add buttons in the panel.
  const stagedUrls = new Set(
    staged.flatMap((item) => (item.kind === "url" ? [item.url] : [])),
  );

  const stageSuggestion = (suggestion: DiscoveredSource) => {
    if (stagedUrls.has(suggestion.url)) return;
    setStaged((prev) => [
      ...prev,
      {
        id: stagedId(),
        kind: "url",
        url: suggestion.url,
        title: suggestion.title,
      },
    ]);
  };

  const stageAllSuggestions = () => {
    const remaining = (discovery.discovery?.results ?? []).filter(
      (result) => !stagedUrls.has(result.url),
    );
    setStaged((prev) => [
      ...prev,
      ...remaining.map(
        (result): StagedSource => ({
          id: stagedId(),
          kind: "url",
          url: result.url,
          title: result.title,
        }),
      ),
    ]);
  };

  const removeStaged = (id: string) => {
    setStaged((prev) => prev.filter((item) => item.id !== id));
  };

  const submit = () => {
    if (staged.length === 0) return;
    // StagedSource is NewSourceInput plus local extras (list key, suggested
    // title); the extra properties are harmless to the ingestion layer.
    addSources(staged);
    close();
  };

  const estimate = estimateBatchLabel(staged);
  const hasBlockingWarning = staged.some(
    (item) => stagedWarning(item)?.tone === "error",
  );
  // One floating panel at a time above the bottom bar.
  const showSuggestions = discovery.discovery !== null && !isTextOpen;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            role="presentation"
            onClick={close}
            className="fixed inset-0 backdrop-blur-md bg-black/5"
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.1 }}
            className={cn(
              "relative flex w-full max-w-2xl h-[min(85vh,34rem)] flex-col overflow-hidden",
              "rounded-2xl border border-zinc-200 bg-white shadow-md/3",
            )}
            // stopPropagation throughout: the dialog renders inside the
            // sources page container, which has its own drag handlers — a
            // bubbled drop would stage the same files a second time.
            onDragEnter={(event) => {
              if (!hasFiles(event)) return;
              event.preventDefault();
              event.stopPropagation();
              setDragDepth((depth) => depth + 1);
            }}
            onDragOver={(event) => {
              if (!hasFiles(event)) return;
              event.preventDefault();
              event.stopPropagation();
            }}
            onDragLeave={(event) => {
              if (!hasFiles(event)) return;
              event.stopPropagation();
              setDragDepth((depth) => Math.max(0, depth - 1));
            }}
            onDrop={(event) => {
              if (!hasFiles(event)) return;
              event.preventDefault();
              event.stopPropagation();
              setDragDepth(0);
              stageFiles(event.dataTransfer.files);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) stageFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3">
              <h2 className="flex-1 text-base font-medium tracking-tight">
                Add sources
              </h2>
              <IconButton label="Close" onClick={close}>
                <CloseIcon className="size-4" />
              </IconButton>
            </div>

            {/* The batch */}
            <StagedSourceList
              staged={staged}
              onRemove={removeStaged}
              onEditText={editStagedText}
            />

            {/* Bottom bar: Upload menu + link/AI input, with floating panels */}
            <div className="relative flex flex-col gap-1.5 p-4 pt-2">
              {showSuggestions && discovery.discovery && (
                <DiscoveryPanel
                  className="absolute inset-x-4 bottom-full z-10 mb-2 shadow-lg"
                  topic={discovery.discovery.topic}
                  results={discovery.discovery.results}
                  stagedUrls={stagedUrls}
                  onStage={stageSuggestion}
                  onStageAll={stageAllSuggestions}
                  onDismiss={discovery.dismiss}
                />
              )}

              {isTextOpen && (
                <div
                  className={cn(
                    "absolute inset-x-4 bottom-full z-10 mb-2",
                    "flex flex-col overflow-hidden",
                    "rounded-xl border border-zinc-200 bg-white shadow-lg",
                  )}
                >
                  <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
                    <InstructionsIcon className="size-4 shrink-0 text-zinc-400" />
                    <p className="flex-1 text-sm text-zinc-700">
                      {editingTextId ? "Edit text" : "Write or paste text"}
                    </p>
                    <IconButton label="Close text form" onClick={closeTextPanel}>
                      <CloseIcon className="size-4" />
                    </IconButton>
                  </div>
                  <TextForm
                    className="p-3"
                    title={textTitle}
                    body={textBody}
                    submitLabel={editingTextId ? "Save changes" : "Add to batch"}
                    onTitleChange={setTextTitle}
                    onBodyChange={setTextBody}
                    onSubmit={stageText}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex min-h-11 items-center gap-2 shrink-0 px-3",
                        "rounded-full border border-zinc-200 bg-white shadow-md/3",
                        "cursor-pointer text-sm select-none hover:bg-zinc-100",
                        "aria-expanded:bg-zinc-100",
                      )}
                    >
                      <UploadIcon className="size-5" />
                      Upload
                      <ChevronDownIcon className="size-4 text-zinc-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top">
                    <DropdownMenuItem
                      onSelect={() => fileInputRef.current?.click()}
                    >
                      <UploadIcon className="text-zinc-500" />
                      Upload PDFs
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        discovery.dismiss();
                        // A fresh form, in case an edit session was left open.
                        closeTextPanel();
                        setIsTextOpen(true);
                      }}
                    >
                      <InstructionsIcon className="text-zinc-500" />
                      Write or paste text
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <SourceInput
                  value={query}
                  isBusy={discovery.isDiscovering}
                  onChange={(value) => {
                    setQuery(value);
                    setInputError(null);
                    discovery.clearError();
                  }}
                  onSubmit={submitQuery}
                />
              </div>

              {(inputError || discovery.error) && (
                <p className="px-1 text-xs text-red-600">
                  {inputError ?? discovery.error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div
              className={cn(
                "flex items-center justify-between gap-2",
                "border-t border-zinc-100 bg-zinc-50/50 px-4 py-3",
              )}
            >
              <p className="text-xs text-zinc-400">
                {staged.length === 0
                  ? "Sources process together in the background."
                  : `${staged.length} ${staged.length === 1 ? "source" : "sources"}${
                      estimate ? ` · est. ${estimate}` : ""
                    }`}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={close}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={staged.length === 0 || hasBlockingWarning}
                >
                  {staged.length > 1
                    ? `Add ${staged.length} sources`
                    : "Add source"}
                </Button>
              </div>
            </div>

            {/* Drop highlight ring */}
            {isDraggingOver && (
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-zinc-400" />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddSourceDialog;
