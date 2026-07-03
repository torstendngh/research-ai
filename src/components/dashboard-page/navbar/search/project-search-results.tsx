"use client";

import { cn } from "@/lib/tailwind-utils";
import type { Project } from "@/lib/actions/projects";
import ProjectIcon from "@/components/shared/icons/project-icon";

interface ProjectSearchResultsProps {
  projects: Project[];
  activeIndex: number;
  onActivate: (index: number) => void;
  onSelect: (project: Project) => void;
}

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const ProjectSearchResults = ({
  projects,
  activeIndex,
  onActivate,
  onSelect,
}: ProjectSearchResultsProps) => {
  if (projects.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-zinc-500">No projects found.</p>
      </div>
    );
  }

  return (
    <ul id="project-search-results" role="listbox" className="flex flex-col gap-1 p-2 overflow-y-auto">
      {projects.map((project, index) => {
        const isActive = index === activeIndex;

        return (
          <li key={project.id} role="option" aria-selected={isActive}>
            <button
              id={`project-search-result-${index}`}
              type="button"
              onMouseEnter={() => onActivate(index)}
              onClick={() => onSelect(project)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                "cursor-pointer not-hover:transition-colors duration-100",
                isActive ? "bg-zinc-100 text-zinc-800" : "text-zinc-700 hover:bg-zinc-100",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg not-hover:transition-colors duration-100",
                  isActive ? "bg-zinc-200 text-zinc-500" : "bg-zinc-100 text-zinc-500",
                )}
              >
                <ProjectIcon className="size-5" />
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{project.title}</span>
                <span
                  className={cn(
                    "truncate text-xs text-zinc-400",
                  )}
                >
                  Updated {formatUpdatedAt(project.updated_at)}
                  {project.description ? ` - ${project.description}` : ""}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ProjectSearchResults;
