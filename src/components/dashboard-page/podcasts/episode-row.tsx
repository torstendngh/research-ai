"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/tailwind-utils";
import IconButton from "@/components/shared/icon-button";
import AddIcon from "@/components/shared/icons/add-icon";
import DownloadIcon from "@/components/shared/icons/download-icon";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import PauseIcon from "@/components/shared/icons/pause-icon";
import PlayIcon from "@/components/shared/icons/play-icon";
import TrashIcon from "@/components/shared/icons/trash-icon";
import { Slider } from "@/components/shared/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shared/tooltip";
import type { Podcast } from "@/lib/podcasts";

function durationLabel(seconds: number): string {
  return `~${Math.max(1, Math.round(seconds / 60))} min`;
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * One episode in the list. The header — play/pause, title, actions — keeps its
 * layout whether collapsed or playing; expanding only reveals the seek strip at
 * the bottom of the card. The audio element mounts only while active, so
 * switching episodes tears playback down cleanly.
 */
const EpisodeRow = ({
  episode,
  isActive,
  onPlay,
  onClosePlayer,
  onDelete,
  deleting,
}: {
  episode: Podcast;
  isActive: boolean;
  onPlay: () => void;
  onClosePlayer: () => void;
  onDelete: () => void;
  deleting: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // The stored value is a script-based estimate; the real duration replaces it
  // as soon as the audio metadata loads.
  const [duration, setDuration] = useState(episode.duration_seconds);

  // Collapsing the row resets playback back to the start. Adjusted during
  // render (not in an effect) so the reset lands in the same pass.
  const [wasActive, setWasActive] = useState(isActive);
  if (wasActive !== isActive) {
    setWasActive(isActive);
    if (!isActive) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }

  const togglePlay = () => {
    if (!isActive) {
      onPlay();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  return (
    <li
      className={cn(
        "group flex flex-col overflow-hidden rounded-md p-2 not-hover:transition-colors duration-100",
        isActive ? "bg-zinc-100" : "hover:bg-zinc-100",
      )}
    >
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!episode.audioUrl}
          aria-label={isActive && isPlaying ? "Pause episode" : "Play episode"}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
            "cursor-pointer disabled:pointer-events-none disabled:opacity-50",
            isActive
              ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-700"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white",
          )}
        >
          {isActive && isPlaying ? (
            <PauseIcon className="size-4" />
          ) : (
            <PlayIcon className="size-4" />
          )}
        </button>

        <div className="flex min-w-0 flex-col items-start justify-center overflow-hidden">
          <span className="w-full truncate text-sm" title={episode.title}>
            {episode.title}
          </span>
          <span
            className="w-full truncate text-xs text-zinc-400"
            title={episode.prompt}
          >
            {durationLabel(episode.duration_seconds)} ·{" "}
            {dateLabel(episode.created_at)}
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {episode.downloadUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={episode.downloadUrl}
                  aria-label="Download episode"
                  className={cn(
                    "flex items-center justify-center rounded-md p-1 text-zinc-400",
                    "cursor-pointer hover:bg-zinc-200 hover:text-zinc-700",
                    isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <DownloadIcon className="size-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom">Download episode</TooltipContent>
            </Tooltip>
          )}
          {isActive && (
            <IconButton
              label="Close player"
              side="bottom"
              onClick={onClosePlayer}
              className="hover:bg-zinc-200"
            >
              <AddIcon className="size-4 rotate-45" />
            </IconButton>
          )}
          <IconButton
            label="Delete episode"
            onClick={onDelete}
            disabled={deleting}
            className={cn(
              "hover:bg-zinc-200",
              deleting || isActive
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100",
            )}
          >
            {deleting ? (
              <LoadingIcon className="size-4 animate-spin" />
            ) : (
              <TrashIcon className="size-4" />
            )}
          </IconButton>
        </div>
      </div>

      {isActive && (
        <div className="mt-3 flex items-center gap-3">
          <audio
            ref={audioRef}
            src={episode.audioUrl ?? undefined}
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              if (Number.isFinite(e.currentTarget.duration)) {
                setDuration(e.currentTarget.duration);
              }
            }}
          />
          <Slider
            min={0}
            max={Math.max(1, duration)}
            step={1}
            value={[Math.min(currentTime, duration)]}
            onValueChange={([value]) => seek(value)}
            aria-label="Seek"
            className="min-w-0 flex-1 cursor-pointer"
          />
          <span className="shrink-0 text-xs tabular-nums text-zinc-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      )}
    </li>
  );
};

export default EpisodeRow;
