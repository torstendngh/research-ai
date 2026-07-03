"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, type Project } from "@/lib/actions/projects";
import { DEFAULT_RESPONSE_LENGTH } from "@/lib/settings";

type CreatingDraftProject = {
  key: number;
  promise: Promise<Project>;
};

function makeDraftProject(): Project {
  const now = new Date().toISOString();
  return {
    id: "",
    title: "Untitled project",
    description: null,
    topics: [],
    response_length: DEFAULT_RESPONSE_LENGTH,
    created_at: now,
    updated_at: now,
  };
}

/**
 * While no project is persisted yet the dashboard works against an in-memory
 * draft. `ensureProject` creates the real project on first use (deduped per
 * draft via `draftKey`) and navigates to it.
 */
export function useDraftProject(project: Project | null) {
  const router = useRouter();
  const [createdDraftProject, setCreatedDraftProject] = useState<Project | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const creatingDraftProjectRef = useRef<CreatingDraftProject | null>(null);

  const draftProject = useMemo(() => makeDraftProject(), []);
  const currentProject = project ?? createdDraftProject ?? draftProject;
  const isDraftProject = !project && !createdDraftProject;

  const ensureProject = useCallback(async () => {
    if (project) return project;
    if (createdDraftProject) return createdDraftProject;

    if (creatingDraftProjectRef.current?.key !== draftKey) {
      creatingDraftProjectRef.current = {
        key: draftKey,
        promise: createProject(),
      };
    }

    const created = await creatingDraftProjectRef.current.promise;
    setCreatedDraftProject(created);
    router.replace(`/dashboard/${created.id}`);
    return created;
  }, [createdDraftProject, draftKey, project, router]);

  /** Called (during render) when navigating to a different project. */
  const reset = useCallback(() => {
    setCreatedDraftProject(null);
    setDraftKey((key) => key + 1);
  }, []);

  return { currentProject, isDraftProject, ensureProject, reset };
}
