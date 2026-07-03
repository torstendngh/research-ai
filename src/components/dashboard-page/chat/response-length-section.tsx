"use client";

import { useState } from "react";
import { cn } from "@/lib/tailwind-utils";
import { setProjectResponseLength } from "@/lib/actions/projects";
import {
  DEFAULT_RESPONSE_LENGTH,
  RESPONSE_LENGTHS,
  isResponseLength,
  type ResponseLength,
} from "@/lib/settings";
import { useDashboard } from "../dashboard-context";
import SectionHeader from "./section-header";

/** Per-project preset for how long the AI's answers should be. */
const ResponseLengthSection = () => {
  const { project, ensureProject } = useDashboard();
  const current = isResponseLength(project?.response_length)
    ? project.response_length
    : DEFAULT_RESPONSE_LENGTH;

  const [value, setValue] = useState<ResponseLength>(current);
  const [isSaving, setIsSaving] = useState(false);

  // Re-sync when navigating to a different project.
  const projectId = project?.id ?? null;
  const [trackedId, setTrackedId] = useState(projectId);
  if (projectId !== trackedId) {
    setTrackedId(projectId);
    setValue(current);
  }

  const handleSelect = async (next: ResponseLength) => {
    if (!project || next === value || isSaving) return;
    const previous = value;
    setValue(next); // optimistic
    setIsSaving(true);
    try {
      const targetProject = await ensureProject();
      await setProjectResponseLength(targetProject.id, next);
    } catch {
      setValue(previous); // revert on failure
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader
        title="Response length"
        hint="How long the AI's answers should be in this project."
      />
      <div className="flex flex-col gap-2">
        {RESPONSE_LENGTHS.map((preset) => {
          const active = value === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelect(preset.id)}
              disabled={!project || isSaving}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg border p-2 text-left",
                "transition-colors outline-none cursor-pointer",
                "disabled:cursor-not-allowed disabled:opacity-60",
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
              )}
            >
              <span className="text-sm font-medium">{preset.label}</span>
              <span className={cn("text-xs", active ? "text-zinc-300" : "text-zinc-400")}>
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ResponseLengthSection;
