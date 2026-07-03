"use client";

import { useEffect, useState } from "react";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import { getProjectUsage, type ProjectUsage } from "@/lib/actions/projects";
import { useDashboard } from "../dashboard-context";
import SectionHeader from "./section-header";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const StorageSection = () => {
  const { project, sources, isDraftProject } = useDashboard();
  const projectId = project?.id ?? null;

  // Tagged with the project + sources it was fetched for; a stale tag means
  // "loading" — no state reset needed when the effect re-runs.
  const sourcesSignature = sources.map((source) => source.id).join(",");
  const usageKey = `${projectId}:${sourcesSignature}`;
  const [loaded, setLoaded] = useState<{ key: string; data: ProjectUsage } | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    getProjectUsage(projectId).then((result) => {
      if (active) setLoaded({ key: usageKey, data: result });
    });
    return () => {
      active = false;
    };
  }, [projectId, usageKey]);

  const usage = loaded?.key === usageKey ? loaded.data : null;

  if (isDraftProject) {
    return (
      <div className="flex flex-col gap-2">
        <SectionHeader
          title="Storage"
          hint="This draft has not been saved yet."
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["Sources", "Sections", "Search chunks", "Stored text"].map((label) => (
            <div
              key={label}
              className="flex flex-col gap-0.5 rounded-lg border border-zinc-200 bg-white p-2.5"
            >
              <span className="text-sm font-medium text-zinc-800">0</span>
              <span className="text-xs text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = usage
    ? [
        { label: "Sources", value: String(usage.sourceCount) },
        { label: "Sections", value: String(usage.sectionCount) },
        { label: "Search chunks", value: String(usage.chunkCount) },
        { label: "Stored text", value: `~${formatBytes(usage.estimatedTextBytes)}` },
      ]
    : null;

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader
        title="Storage"
        hint="What this project's sources take up after processing."
      />
      {stats ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-0.5 rounded-lg border border-zinc-200 bg-white p-2.5"
            >
              <span className="text-sm font-medium text-zinc-800">{stat.value}</span>
              <span className="text-xs text-zinc-400">{stat.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2.5 text-sm text-zinc-400">
          <LoadingIcon className="size-4 animate-spin" />
          Calculating…
        </div>
      )}
    </div>
  );
};

export default StorageSection;
