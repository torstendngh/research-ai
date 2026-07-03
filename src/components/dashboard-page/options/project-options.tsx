"use client";

import { useDashboard } from "../dashboard-context";
import DangerZoneSection from "./danger-zone-section";
import ProjectNameSection from "./project-name-section";
import StorageSection from "./storage-section";

/** Everything about the project itself: name, storage taken up, deletion. */
const ProjectOptions = () => {
  const { project } = useDashboard();

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-zinc-400">
        Select a project to see its options.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 overflow-y-auto p-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <ProjectNameSection />
        <StorageSection />
        <DangerZoneSection />
      </div>
    </div>
  );
};

export default ProjectOptions;
