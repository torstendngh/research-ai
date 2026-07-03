"use client";

import { cn } from "@/lib/tailwind-utils";
import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Logo from "./logo";
import Avatar from "./avatar";
import ProjectTab from "./project-tab";
import Button from "./button";
import ProjectSearchDialog from "./search";
import NewProjectIcon from "@/components/shared/icons/new-project-icon";
import SearchIcon from "@/components/shared/icons/search-icon";
import SidebarLeftIcon from "@/components/shared/icons/sidebar-left-icon";
import { useNavbar } from "./navbar-context";
import type { Project } from "@/lib/actions/projects";

const Navbar = ({ projects }: { projects: Project[] }) => {
  const { setIsNavbarOpen, isNavbarOpen } = useNavbar();
  const { projectId } = useParams<{ projectId?: string }>();
  const router = useRouter();
  const [isNavigating, startNavigating] = useTransition();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleNewProject = () => {
    startNavigating(() => {
      router.push("/dashboard");
    });
  };

  return (
    <nav className={cn("flex flex-col", isNavbarOpen && "max-w-55 w-full")}>
      <Logo />
      <div className="flex flex-col p-2 gap-0.5">
        <Button
          label="New Project"
          icon={<NewProjectIcon />}
          onClick={handleNewProject}
          disabled={isNavigating}
        />
        <Button
          label="Search"
          icon={<SearchIcon />}
          onClick={() => setIsSearchOpen(true)}
        />
      </div>
      {isNavbarOpen && (
        <ul className="flex flex-col p-2 overflow-y-auto flex-1 gap-0.5">
          {projects.map((p) => (
            <ProjectTab key={p.id} project={p} active={p.id === projectId} />
          ))}
        </ul>
      )}

      <div className="flex flex-col p-2 mt-auto">
        <div
          className={cn(
            "flex gap-0.5 overflow-hidden",
            !isNavbarOpen && "flex-col",
          )}
        >
          <Avatar />
          <Button
            onClick={() => setIsNavbarOpen((value) => !value)}
            className="shrink-0"
            icon={<SidebarLeftIcon />}
            tooltip={isNavbarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          />
        </div>
      </div>
      <ProjectSearchDialog
        isOpen={isSearchOpen}
        projects={projects}
        onClose={() => setIsSearchOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
