"use client";

import { useState } from "react";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { renameProject } from "@/lib/actions/projects";
import { useDashboard } from "../dashboard-context";
import SectionHeader from "./section-header";

const ProjectNameSection = () => {
  const { project, ensureProject } = useDashboard();
  const initial = project?.title ?? "";

  const [name, setName] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  // Re-sync when navigating to a different project (mirrors dashboard-context).
  const projectId = project?.id ?? null;
  const [trackedId, setTrackedId] = useState(projectId);
  if (projectId !== trackedId) {
    setTrackedId(projectId);
    setName(initial);
    setSaved(initial);
  }

  const dirty = name.trim().length > 0 && name.trim() !== saved.trim();

  const handleSave = async () => {
    if (!project || isSaving || !dirty) return;
    setIsSaving(true);
    try {
      const targetProject = await ensureProject();
      await renameProject(targetProject.id, name);
      setSaved(name.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader title="Project name" />
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
          disabled={!project}
          placeholder="Untitled project"
        />
        <Button size="sm" onClick={handleSave} disabled={!project || isSaving || !dirty}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default ProjectNameSection;
