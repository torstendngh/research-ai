import { notFound } from "next/navigation";
import DashboardPage from "@/components/dashboard-page";
import { resolveTabFromSlug } from "@/components/dashboard-page/dashboard-context/tabs";
import { getProject } from "@/lib/actions/projects";
import { listSources } from "@/lib/actions/sources";
import { listChats } from "@/lib/actions/chats";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { projectId } = await params;
  const { tab } = await searchParams;

  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  const [sources, chats] = await Promise.all([
    listSources(projectId),
    listChats(projectId),
  ]);

  // Resolve the opened tab from the URL up front, so a shared/typed link lands
  // on the right tab (and a source-gated tab on an empty project falls back to
  // Sources) without a client-side flash.
  const initialTab = resolveTabFromSlug(tab, sources.length > 0);

  return (
    <DashboardPage
      project={project}
      sources={sources}
      chats={chats}
      initialTab={initialTab}
    />
  );
}
