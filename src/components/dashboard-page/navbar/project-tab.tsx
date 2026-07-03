"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/tailwind-utils";
import ProjectIcon from "@/components/shared/icons/project-icon";
import MoreVerticalIcon from "@/components/shared/icons/more-vertical-icon";
import RenameIcon from "@/components/shared/icons/rename-icon";
import TrashIcon from "@/components/shared/icons/trash-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shared/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shared/tooltip";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import Button from "./button";
import {
  deleteProject,
  renameProject,
  type Project,
} from "@/lib/actions/projects";

interface ProjectTabProps {
  project: Project;
  active: boolean;
}

const ProjectTab = ({ project, active }: ProjectTabProps) => {
  const router = useRouter();
  const [isRenameMode, setIsRenameMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submitRename = async (value: string) => {
    setIsRenameMode(false);
    const title = value.trim();
    if (!title || title === project.title) return;
    await renameProject(project.id, title);
    router.refresh();
  };

  const handleDelete = async () => {
    await deleteProject(project.id);
    if (active) router.push("/dashboard");
    router.refresh();
  };

  if (isRenameMode) {
    return (
      <li className="flex flex-col">
        <div className="flex items-center gap-2 rounded-md bg-zinc-200 px-2 py-1.5 select-none">
          <div className="flex items-center justify-center shrink-0 [&>svg]:size-5">
            <ProjectIcon />
          </div>
          <input
            type="text"
            autoFocus
            defaultValue={project.title}
            placeholder="Project Name"
            className={cn(
              "ring ring-blue-500 focus:outline-0",
              "flex-1 min-w-0 rounded-sm bg-white px-1 text-sm",
            )}
            onFocus={(event) => event.currentTarget.select()}
            // Rename only commits on Enter; blur/Escape just cancel.
            onBlur={() => setIsRenameMode(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitRename(event.currentTarget.value);
              if (event.key === "Escape") setIsRenameMode(false);
            }}
          />
        </div>
      </li>
    );
  }

  return (
    <li className="relative group flex flex-col">
      <Button
        label={project.title}
        icon={<ProjectIcon />}
        href={`/dashboard/${project.id}`}
        active={active || menuOpen}
        className="group-hover:bg-zinc-200"
      />

      {/* Sibling of the tab (not a child) so clicking it never navigates. */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger
              aria-label="More actions"
              className={cn(
                "absolute right-0 top-0 bottom-0 px-1.5 flex items-center justify-center rounded-md",
                "cursor-pointer text-zinc-800 hover:bg-zinc-300 bg-zinc-200 [&>svg]:size-5",
                "opacity-0 group-hover:opacity-100",
                menuOpen && "opacity-100 bg-zinc-300",
              )}
            >
              <MoreVerticalIcon />
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">More actions</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsRenameMode(true)}>
            <RenameIcon />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmDelete(true)}
          >
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete project?"
        description={
          <>
            <span className="font-medium text-zinc-700">{project.title}</span>{" "}
            and its sources, chats, and mind map will be permanently deleted.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete project"
      />
    </li>
  );
};

export default ProjectTab;
