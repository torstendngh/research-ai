"use client";

import { useEffect, useRef, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/shared/input";
import SearchIcon from "@/components/shared/icons/search-icon";
import type { Project } from "@/lib/actions/projects";
import { useProjectSearch } from "./use-project-search";
import ProjectSearchResults from "./project-search-results";

interface ProjectSearchDialogProps {
  isOpen: boolean;
  projects: Project[];
  onClose: () => void;
}

const ProjectSearchDialog = ({
  isOpen,
  projects,
  onClose,
}: ProjectSearchDialogProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isNavigating, startNavigating] = useTransition();
  const {
    query,
    setQuery,
    results,
    activeIndex,
    setActiveIndex,
    activeProject,
    moveActive,
  } = useProjectSearch(projects);

  useEffect(() => {
    if (!isOpen) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  const close = () => {
    setQuery("");
    onClose();
  };

  const selectProject = (selected: Project | null) => {
    if (!selected || isNavigating) return;

    startNavigating(() => {
      close();
      router.push(`/dashboard/${selected.id}`);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      moveActive(event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectProject(activeProject);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex p-8 flex flex-col"
          onKeyDown={handleKeyDown}
        >
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            aria-label="Close project search"
            onClick={close}
            className="fixed inset-0 cursor-default bg-black/10 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search projects"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="relative flex w-full max-w-xl mx-auto flex-col max-h-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-black/10"
          >
            <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
              <SearchIcon className="size-5 shrink-0 text-zinc-400" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects"
                disabled={isNavigating}
                role="combobox"
                aria-expanded="true"
                aria-controls="project-search-results"
                aria-activedescendant={
                  results.length > 0 ? `project-search-result-${activeIndex}` : undefined
                }
                className="h-8 border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-0 focus-visible:ring-0"
              />
            </div>

            <ProjectSearchResults
              projects={results}
              activeIndex={activeIndex}
              onActivate={setActiveIndex}
              onSelect={selectProject}
            />

            <div className="flex items-center gap-3 border-t border-zinc-100 px-4 py-2 text-xs text-zinc-400">
              <span>Enter to open</span>
              <span>Up/Down or Tab to move</span>
              <span>Esc to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectSearchDialog;
