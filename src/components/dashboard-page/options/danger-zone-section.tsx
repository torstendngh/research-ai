"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/button";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { deleteProject } from "@/lib/actions/projects";
import { useDashboard } from "../dashboard-context";
import SectionHeader from "./section-header";

const DangerZoneSection = () => {
  const { project, isDraftProject } = useDashboard();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    if (!project) return;
    await deleteProject(project.id);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader
        title="Danger zone"
        hint="Deleting a project removes its sources, chats, and mind map. This cannot be undone."
      />
      {isDraftProject ? (
        <div className="rounded-lg border border-zinc-200 p-2.5 text-sm text-zinc-400">
          Nothing to delete yet. This draft is not saved until you add content.
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-2.5">
          <span className="text-sm text-zinc-600">Delete this project</span>
          <Button
            variant="destructive-outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
          >
            Delete…
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete project?"
        description={
          <>
            <span className="font-medium text-zinc-700">{project?.title}</span>{" "}
            and its sources, chats, and mind map will be permanently deleted.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete forever"
      />
    </div>
  );
};

export default DangerZoneSection;
