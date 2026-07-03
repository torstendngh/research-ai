"use client";

import { cn } from "@/lib/tailwind-utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/shared/button";
import IconButton from "@/components/shared/icon-button";
import CloseIcon from "@/components/shared/icons/close-icon";
import { useDashboard } from "../dashboard-context";
import { hasFiles } from "./source-utils";
import PdfDropzone from "./pdf-dropzone";
import StagedSourceList from "./staged-source-list";
import TextForm from "./text-form";
import UrlField from "./url-field";
import { stagedId, type StagedSource } from "./staged-source";

interface AddSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Stages a batch of sources — URLs, PDFs, and pasted text — in a list, then
 * hands the whole batch to the dashboard context on confirm. The batch
 * ingests in parallel in the background (progress shows on the source rows)
 * and the project metadata is generated once at the end.
 *
 * URL/PDF/text staging helpers live in `./staged-source`; the queued list is
 * rendered by `./staged-source-list`.
 */
const AddSourceDialog = ({ isOpen, onClose }: AddSourceDialogProps) => {
  const { addSources } = useDashboard();

  const [staged, setStaged] = useState<StagedSource[]>([]);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Pasted-text form (collapsed until opened).
  const [isTextFormOpen, setIsTextFormOpen] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textBody, setTextBody] = useState("");

  // Depth counter because dragenter/dragleave also fire for children.
  const [dragDepth, setDragDepth] = useState(0);
  const isDraggingOver = dragDepth > 0;

  const close = () => {
    setStaged([]);
    setUrl("");
    setUrlError(null);
    setIsTextFormOpen(false);
    setTextTitle("");
    setTextBody("");
    setDragDepth(0);
    onClose();
  };

  const stageUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Be forgiving about missing protocols — "example.com/article" is a URL.
    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    try {
      new URL(candidate);
    } catch {
      setUrlError("That doesn't look like a valid URL.");
      return;
    }

    if (staged.some((item) => item.kind === "url" && item.url === candidate)) {
      setUrlError("That URL is already in the list.");
      return;
    }

    setStaged((prev) => [...prev, { id: stagedId(), kind: "url", url: candidate }]);
    setUrl("");
    setUrlError(null);
  };

  const stageFiles = (files: FileList) => {
    const pdfs = Array.from(files)
      .filter(
        (file) =>
          file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
      )
      .map((file): StagedSource => ({ id: stagedId(), kind: "pdf", file }));

    if (pdfs.length > 0) setStaged((prev) => [...prev, ...pdfs]);
  };

  const stageText = () => {
    const text = textBody.trim();
    if (!text) return;

    const title = textTitle.trim() || "Pasted text";
    setStaged((prev) => [...prev, { id: stagedId(), kind: "text", title, text }]);
    setTextTitle("");
    setTextBody("");
    setIsTextFormOpen(false);
  };

  const removeStaged = (id: string) => {
    setStaged((prev) => prev.filter((item) => item.id !== id));
  };

  const submit = () => {
    if (staged.length === 0) return;
    // StagedSource is NewSourceInput plus a local list key; the extra `id`
    // property is harmless to the ingestion layer.
    addSources(staged);
    close();
  };

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
              "relative flex w-full max-w-lg max-h-[85vh] flex-col overflow-hidden",
              "rounded-2xl border border-zinc-200 bg-white shadow-md/3",
            )}
            onDragEnter={(event) => {
              if (!hasFiles(event)) return;
              event.preventDefault();
              setDragDepth((depth) => depth + 1);
            }}
            onDragOver={(event) => {
              if (hasFiles(event)) event.preventDefault();
            }}
            onDragLeave={(event) => {
              if (hasFiles(event)) setDragDepth((depth) => Math.max(0, depth - 1));
            }}
            onDrop={(event) => {
              if (!hasFiles(event)) return;
              event.preventDefault();
              setDragDepth(0);
              stageFiles(event.dataTransfer.files);
            }}
          >
            {/* Header */}
            <div className="flex items-start gap-2 p-5 pb-4">
              <div className="flex flex-1 flex-col gap-1">
                <h2 className="text-lg font-medium tracking-tight">Add sources</h2>
                <p className="text-sm text-zinc-500">
                  Collect links, PDFs, and notes, then add them all at once.
                </p>
              </div>
              <IconButton label="Close" onClick={close} className="-m-1">
                <CloseIcon className="size-4" />
              </IconButton>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-5">
              <PdfDropzone isDraggingOver={isDraggingOver} onFiles={stageFiles} />

              <UrlField
                value={url}
                error={urlError}
                onChange={(value) => {
                  setUrl(value);
                  setUrlError(null);
                }}
                onSubmit={stageUrl}
              />

              <TextForm
                isOpen={isTextFormOpen}
                onToggle={() => setIsTextFormOpen((open) => !open)}
                title={textTitle}
                body={textBody}
                onTitleChange={setTextTitle}
                onBodyChange={setTextBody}
                onSubmit={stageText}
              />

              <StagedSourceList staged={staged} onRemove={removeStaged} />
            </div>

            {/* Footer */}
            <div
              className={cn(
                "flex items-center justify-between gap-2",
                "border-t border-zinc-100 bg-zinc-50/50 px-5 py-3.5",
              )}
            >
              <p className="text-xs text-zinc-400">
                {staged.length === 0
                  ? "Sources process together in the background."
                  : `${staged.length} ${staged.length === 1 ? "source" : "sources"} staged`}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={close}>
                  Cancel
                </Button>
                <Button size="sm" onClick={submit} disabled={staged.length === 0}>
                  {staged.length > 1 ? `Add ${staged.length} sources` : "Add source"}
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
