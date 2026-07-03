"use client";

import { cn } from "@/lib/tailwind-utils";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import LogoIcon from "@/components/shared/icons/logo-icon";
import AddIcon from "@/components/shared/icons/add-icon";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { deleteSource, setSourceEnabled, type Source } from "@/lib/actions/sources";
import { useDashboard } from "../dashboard-context";
import AddSourceDialog, { type AddSourceDialogHandle } from "./add-source-dialog";
import PendingRow from "./pending-row";
import SourceListItem from "./source-list-item";
import { hasFiles } from "./source-utils";

const Sources = () => {
  const { sources, pendingSources, project } = useDashboard();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  // Stages page-dropped PDFs into the dialog's batch.
  const addDialogRef = useRef<AddSourceDialogHandle>(null);
  const [pendingDelete, setPendingDelete] = useState<Source | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  // Optimistic on/off state so the switch flips instantly; the refreshed server
  // list carries the persisted value and the override simply matches it.
  const [enabledOverrides, setEnabledOverrides] = useState<
    Record<string, boolean>
  >({});

  // Drag-and-drop; a depth counter because dragenter/dragleave also fire for
  // every child element crossed.
  const [dragDepth, setDragDepth] = useState(0);
  const isDraggingFiles = dragDepth > 0;

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-zinc-400">
        Select a project to manage sources.
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteSource(id);
      // The row disappears with the refreshed list; the id stays in
      // deletingIds so the spinner shows until then.
      router.refresh();
    } catch {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleEnabled = async (id: string, next: boolean) => {
    setEnabledOverrides((prev) => ({ ...prev, [id]: next }));
    try {
      await setSourceEnabled(id, next);
      router.refresh();
    } catch {
      // Roll back to the server value on failure.
      setEnabledOverrides((prev) => {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    setDragDepth(0);

    // Route drops through the add dialog so they get the same batch treatment
    // (size warnings, time estimate, one meta generation on confirm).
    const pdfs = Array.from(event.dataTransfer.files).filter(
      (file) =>
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfs.length === 0) return;
    addDialogRef.current?.stageFiles(pdfs);
    setIsAdding(true);
  };

  const isEmpty = sources.length === 0 && pendingSources.length === 0;

  // Shared between the empty-state hero and the regular bottom bar.
  const addButton = (
    <button
      type="button"
      onClick={() => setIsAdding(true)}
      className={cn(
        "flex min-h-11.5 w-full items-center justify-center gap-2 shadow-md/3",
        "px-4 rounded-full",
        "cursor-pointer bg-white hover:bg-zinc-100",
        "border border-zinc-200",
      )}
    >
      <div className="flex items-center justify-center p-0.5 bg-zinc-100 rounded-full">
        <AddIcon className="size-5" />
      </div>
      <span className="text-sm">Add sources</span>
    </button>
  );

  return (
    // Centered column so the list stays readable when the view is full-width.
    <div
      className="relative flex flex-col overflow-hidden flex-1 w-full max-w-3xl mx-auto"
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
      onDrop={handleDrop}
    >
      {isEmpty ? (
        // Empty state: logo + pitch with the add button front and center. The
        // moment the first source starts processing, the list layout takes over.
        <div className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <LogoIcon className="size-16 text-zinc-200" />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-medium tracking-tight">
                Start with your sources
              </h2>
              <p className="max-w-sm text-sm text-balance text-zinc-400">
                Collect PDFs, links, text, and AI-found sources in one batch —
                drop files anywhere or press the button below.
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-2">{addButton}</div>
        </div>
      ) : (
        <>
          <ul className="flex flex-col overflow-y-auto flex-1 p-2 gap-0.5">
            {pendingSources.map((pending) => (
              <PendingRow key={pending.id} pending={pending} />
            ))}

            {sources.map((source) => (
              <SourceListItem
                key={source.id}
                source={source}
                enabled={enabledOverrides[source.id] ?? source.enabled}
                deleting={deletingIds.has(source.id)}
                onToggleEnabled={(next) => handleToggleEnabled(source.id, next)}
                onDelete={() => setPendingDelete(source)}
              />
            ))}
          </ul>

          <div className="flex p-4 pt-0 mt-2">{addButton}</div>
        </>
      )}

      {/* Drop overlay */}
      {isDraggingFiles && (
        <div
          className={cn(
            "pointer-events-none absolute inset-2 z-10",
            "flex items-center justify-center",
            "rounded-xl border-2 border-dashed border-zinc-400 bg-white/85",
          )}
        >
          <p className="text-sm font-medium text-zinc-600">
            Drop PDFs to add them as sources
          </p>
        </div>
      )}

      <AddSourceDialog
        ref={addDialogRef}
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) return handleDelete(pendingDelete.id);
        }}
        title="Remove source?"
        description={
          <>
            <span className="font-medium text-zinc-700">
              {pendingDelete?.title ||
                pendingDelete?.file_name ||
                pendingDelete?.url ||
                "This source"}
            </span>{" "}
            will be removed from this project&apos;s tools. This cannot be undone.
          </>
        }
        confirmLabel="Remove source"
      />
    </div>
  );
};

export default Sources;
