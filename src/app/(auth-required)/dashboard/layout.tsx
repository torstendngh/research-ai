import type { ReactNode } from "react";
import Navbar from "@/components/dashboard-page/navbar";
import { NavbarProvider } from "@/components/dashboard-page/navbar/navbar-context";
import { PendingSourcesProvider } from "@/components/dashboard-page/dashboard-context/pending-sources-store";
import { TooltipProvider } from "@/components/shared/tooltip";
import { listProjects } from "@/lib/actions/projects";

/**
 * Shared dashboard chrome. The navbar lives here (not in the per-project page)
 * so it isn't remounted — and its open/collapsed state isn't reset — when
 * navigating between projects.
 *
 * `PendingSourcesProvider` lives here too so in-flight source ingestion (and
 * its "processing" rows) survives the `/dashboard` → `/dashboard/[id]` remount
 * that happens when adding the first source creates the project.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const projects = await listProjects();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-1 bg-zinc-50 h-dvh">
        <NavbarProvider>
          <Navbar projects={projects} />
        </NavbarProvider>
        <div className="flex flex-col flex-1 min-w-0 p-2 pl-0 gap-2">
          <PendingSourcesProvider>{children}</PendingSourcesProvider>
        </div>
      </div>
    </TooltipProvider>
  );
}
