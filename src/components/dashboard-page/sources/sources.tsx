"use client";

import { cn } from "@/lib/tailwind-utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LogoIcon from "@/components/shared/icons/logo-icon";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { deleteSource, setSourceEnabled, type Source } from "@/lib/actions/sources";
import { useDashboard } from "../dashboard-context";
import AddSourceDialog from "./add-source-dialog";
import DiscoveryPanel from "./discovery-panel";
import PendingRow from "./pending-row";
import SourceListItem from "./source-list-item";
import SourcesControls from "./sources-controls";
import { hasFiles } from "./source-utils";
import { useSourceDiscovery } from "./use-source-discovery";

const Sources = () => {
  const { sources, pendingSources, project, addSources } = useDashboard();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Source | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  // Optimistic on/off state so the switch flips instantly; the refreshed server
  // list carries the persisted value and the override simply matches it.
  const [enabledOverrides, setEnabledOverrides] = useState<
    Record<string, boolean>
  >({});

  const discovery = useSourceDiscovery(project?.id ?? null, addSources);

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

    // One batch so project meta regenerates once for all dropped files.
    addSources(
      Array.from(event.dataTransfer.files)
        .filter(
          (file) =>
            file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
        )
        .map((file) => ({ kind: "pdf" as const, file })),
    );
  };

  const isEmpty = sources.length === 0 && pendingSources.length === 0;

  // Shared between the empty-state hero and the regular bottom bar.
  const controls = (
    <SourcesControls
      onAddClick={() => setIsAdding(true)}
      topic={discovery.topic}
      onTopicChange={discovery.onTopicChange}
      onDiscover={discovery.discover}
      isDiscovering={discovery.isDiscovering}
    />
  );

  const discoveryPanel = discovery.discovery;

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
        // Empty state: logo + pitch with the controls front and center. The
        // moment the first source starts processing, the list layout takes over.
        <div className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <LogoIcon className="size-16 text-zinc-200" />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-medium tracking-tight">
                Start with your sources
              </h2>
              <p className="max-w-sm text-sm text-balance text-zinc-400">
                Upload PDFs, paste links or text, drop files anywhere — or ask
                AI to find material on your topic.
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-xl flex-col gap-2">
            {controls}

            {discoveryPanel && (
              <DiscoveryPanel
                topic={discoveryPanel.topic}
                results={discoveryPanel.results}
                addedUrls={discovery.addedUrls}
                onAdd={discovery.addSuggestion}
                onAddAll={discovery.addAllSuggestions}
                onDismiss={discovery.dismiss}
              />
            )}

            {discovery.error && (
              <p className="px-2 text-xs text-red-600">{discovery.error}</p>
            )}
          </div>
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

          {discoveryPanel && (
            <DiscoveryPanel
              className="mx-4 mb-2"
              topic={discoveryPanel.topic}
              results={discoveryPanel.results}
              addedUrls={discovery.addedUrls}
              onAdd={discovery.addSuggestion}
              onAddAll={discovery.addAllSuggestions}
              onDismiss={discovery.dismiss}
            />
          )}

          {discovery.error && (
            <p className="mx-4 mb-2 text-xs text-red-600">{discovery.error}</p>
          )}

          <div className="flex p-4 pt-0 mt-2">{controls}</div>
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

      <AddSourceDialog isOpen={isAdding} onClose={() => setIsAdding(false)} />

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
