"use client";

import { useMemo, useState } from "react";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import PodcastIcon from "@/components/shared/icons/podcast-icon";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { deletePodcast, listPodcasts } from "@/lib/actions/podcasts";
import type { Podcast } from "@/lib/podcasts";
import { useDashboard } from "../dashboard-context";
import PromptComposer from "../prompt-composer";
import { buildPodcastPrompt } from "../prompt-context-format";
import { useGeneratedList } from "../use-generated-list";
import EpisodeRow from "./episode-row";

const Podcasts = () => {
  const { project, sources, podcastPrompt } = useDashboard();
  const projectId = project?.id ?? null;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Podcast | null>(null);

  const hasReadySources = sources.some((source) => source.status === "ready");

  const {
    items: episodes,
    generatingHere,
    errorHere,
    deletingIds,
    isGenerating,
    canGenerate,
    generate,
    deleteItem,
    textareaRef,
  } = useGeneratedList<Podcast>({
    projectId,
    hasReadySources,
    apiPath: "/api/podcasts",
    load: listPodcasts,
    remove: deletePodcast,
    buildPrompt: buildPodcastPrompt,
    prompt: podcastPrompt,
  });

  const suggestions = useMemo(() => {
    const sourceTitles = sources
      .filter((source) => source.status === "ready")
      .map(
        (source) =>
          source.title || source.file_name || source.url || "Untitled",
      )
      .slice(0, 3);
    return [
      "Overview: the big picture across all my sources",
      ...sourceTitles.map((title) => `Deep dive into “${title}”`),
      "Key debates and open questions in this material",
    ];
  }, [sources]);

  const handleDelete = (id: string) =>
    deleteItem(id, () => {
      if (activeId === id) setActiveId(null);
    });

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-zinc-400">
        Select a project to generate podcasts.
      </div>
    );
  }

  const isEmpty = episodes !== null && episodes.length === 0 && !generatingHere;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex w-full max-w-3xl mx-auto flex-1 flex-col overflow-hidden">
        {/* Episode list */}
        <ul className="flex flex-1 flex-col overflow-y-auto p-2 gap-0.5">
          {generatingHere && (
            <li className="flex items-center gap-3 overflow-hidden px-4 py-2">
              <div className="flex size-9 shrink-0 items-center justify-center text-zinc-400">
                <LoadingIcon className="size-5 animate-spin" />
              </div>
              <div className="flex min-w-0 flex-col items-start justify-center overflow-hidden">
                <span
                  className="w-full truncate text-sm"
                  title={generatingHere.prompt}
                >
                  {generatingHere.prompt}
                </span>
                <span className="w-full truncate text-xs text-zinc-400">
                  Generating episode — this can take a couple of minutes…
                </span>
              </div>
            </li>
          )}

          {episodes === null && !generatingHere && (
            <li className="flex justify-center py-8">
              <LoadingIcon className="size-5 animate-spin text-zinc-400" />
            </li>
          )}

          {isEmpty && (
            <li className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <PodcastIcon className="size-6 text-zinc-300" />
              <p className="text-sm text-zinc-400">
                No episodes yet. Describe a topic above to generate your first
                podcast.
              </p>
            </li>
          )}

          {(episodes ?? []).map((episode) => (
            <EpisodeRow
              key={episode.id}
              episode={episode}
              isActive={episode.id === activeId}
              onPlay={() => setActiveId(episode.id)}
              onClosePlayer={() => setActiveId(null)}
              onDelete={() => setPendingDelete(episode)}
              deleting={deletingIds.has(episode.id)}
            />
          ))}
        </ul>

        <PromptComposer
          suggestions={suggestions}
          draft={podcastPrompt.draft}
          onDraftChange={podcastPrompt.setDraft}
          chips={podcastPrompt.chips}
          onRemoveChip={podcastPrompt.removeChip}
          placeholder={
            podcastPrompt.chips.length > 0
              ? "Add episode instructions..."
              : "What should this episode be about?"
          }
          hint={
            !hasReadySources
              ? "Add sources to this project first — episodes are generated from your source material."
              : undefined
          }
          error={errorHere}
          canSubmit={canGenerate}
          submitting={isGenerating}
          onSubmit={generate}
          sendLabel="Generate podcast"
          sendTooltip="Generate a 5-10 minute episode"
          textareaRef={textareaRef}
        />
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) return handleDelete(pendingDelete.id);
        }}
        title="Delete episode?"
        description={
          <>
            <span className="font-medium text-zinc-700">
              {pendingDelete?.title}
            </span>{" "}
            will be permanently deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete episode"
      />
    </div>
  );
};

export default Podcasts;
