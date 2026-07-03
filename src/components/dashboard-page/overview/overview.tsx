"use client";

import { useMemo } from "react";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import { useDashboard } from "../dashboard-context";
import SourceFavicon from "../sources/source-favicon";
import { sourceSubtitle } from "../sources/source-utils";

type OverviewTheme = {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function themeFromProjectId(id: string): OverviewTheme {
  const hash = hashString(id || "draft-project");
  const hue = hash % 360;
  const secondaryHue = (hue + 33)  % 360;
  const accentHue = (hue + 15 ) % 360;

  return {
    primary: `hsl(${hue} 82% 58%)`,
    secondary: `hsl(${secondaryHue} 76% 54%)`,
    accent: `hsl(${accentHue} 86% 64%)`,
    glow: `hsl(${(hue + 24) % 360} 90% 72%)`,
  };
}

const fallbackDescription =
  "This project overview will become more detailed once your sources have been processed. Add research material to generate a focused summary of the project's scope, themes, and direction.";

/** Small uppercase-style label that opens each section. */
const SectionLabel = ({ children }: { children: string }) => (
  <p className="text-xs font-medium text-zinc-400">{children}</p>
);

const Overview = () => {
  const { project, sources, chatPrompt, setMainTab, isGeneratingOverview } =
    useDashboard();
  const theme = useMemo(
    () => themeFromProjectId(project?.id ?? ""),
    [project?.id],
  );
  const description = project?.description || fallbackDescription;
  const paragraphs = useMemo(
    () => description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    [description],
  );
  const topics = project?.topics ?? [];

  // The overview is derived from generated meta. Until that first generation
  // lands there's nothing meaningful to show, so present a loader instead of
  // the placeholder hero + fallback copy.
  const hasContent = Boolean(project?.description) || topics.length > 0;
  if (isGeneratingOverview && !hasContent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <LoadingIcon className="size-6 animate-spin text-zinc-400" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-600">
            Generating project overview
          </p>
          <p className="max-w-xs text-pretty text-sm text-zinc-400">
            Reading your sources to summarize the project&apos;s scope, themes,
            and key topics.
          </p>
        </div>
      </div>
    );
  }

  const askAboutTopic = (label: string) => {
    chatPrompt.fill(`Tell me more about ${label}.`);
    setMainTab("chat");
  };

  const urlCount = sources.filter((s) => s.source_type === "url").length;
  const textCount = sources.filter((s) => s.source_type === "text").length;
  const pdfCount = sources.length - urlCount - textCount;
  const sourcesSummary = [
    urlCount > 0 ? `${urlCount} web ${urlCount === 1 ? "page" : "pages"}` : null,
    pdfCount > 0 ? `${pdfCount} ${pdfCount === 1 ? "PDF" : "PDFs"}` : null,
    textCount > 0 ? `${textCount} text ${textCount === 1 ? "note" : "notes"}` : null,
  ]
    .filter(Boolean)
    .join(" and ");

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <section className="relative min-h-100 overflow-hidden bg-white flex flex-col shrink-0">
        <div
          className="absolute inset-0"
          style={{
            background: [
              `radial-gradient(circle at 18% 8%, ${theme.glow} 0, transparent 100%)`,
              `radial-gradient(circle at 88% 12%, ${theme.secondary} 0, transparent 100%)`,
              `radial-gradient(circle at 62% 78%, ${theme.accent} 0, transparent 100%)`,
              `linear-gradient(135deg, ${theme.primary}, #ffffff 54%, #09090b)`,
            ].join(", "),
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,0.44)_78%)]" />
        <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%220_0_256_256%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22noise%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.85%22_numOctaves=%224%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22256%22_height=%22256%22_filter=%22url(%23noise)%22_opacity=%220.8%22/%3E%3C/svg%3E')]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/55 to-transparent" />

        <div className="relative flex flex-col justify-end p-8 sm:p-10 max-w-3xl mx-auto mt-auto w-full">
          <h1 className="text-balance text-5xl font-medium tracking-[-0.06em] text-white sm:text-7xl">
            {project?.title ?? "Untitled project"}
          </h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-8 pb-24 sm:px-10">
        <section className="pt-10">
          <div className="flex items-center gap-2">
            <SectionLabel>About this project</SectionLabel>
            {isGeneratingOverview && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <LoadingIcon className="size-3 animate-spin" />
                Updating
              </span>
            )}
          </div>
          <div className="mt-4 space-y-5">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-pretty text-lg leading-8 tracking-tight text-zinc-700 sm:text-xl sm:leading-9"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {topics.length > 0 && (
          <section className="pt-14">
            <SectionLabel>Key topics</SectionLabel>
            <ul className="mt-2 divide-y divide-zinc-100">
              {topics.map((topic) => (
                <li key={topic.label}>
                  <button
                    type="button"
                    onClick={() => askAboutTopic(topic.label)}
                    className="group flex w-full flex-col items-start gap-1 py-4 text-left cursor-pointer"
                  >
                    <span className="flex items-baseline gap-2 text-base font-medium tracking-tight text-zinc-900">
                      {topic.label}
                      <span className="text-xs font-normal text-zinc-400 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                        Ask in chat
                      </span>
                    </span>
                    {topic.summary && (
                      <span className="text-pretty text-sm leading-6 text-zinc-500">
                        {topic.summary}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {sources.length > 0 && (
          <section className="pt-14">
            <SectionLabel>Sources</SectionLabel>
            <p className="mt-4 text-pretty text-sm leading-6 text-zinc-500">
              This project draws on {sources.length}{" "}
              {sources.length === 1 ? "source" : "sources"}
              {sourcesSummary ? ` — ${sourcesSummary}` : ""}. Everything the
              chat, mind map, podcasts, and quiz cards produce is grounded in
              this material.
            </p>
            <ul className="mt-4 space-y-1">
              {sources.map((source) => {
                const subtitle = sourceSubtitle(source);
                return (
                  <li key={source.id} className="flex items-center gap-3 py-1.5">
                    <div className="flex size-4 shrink-0 items-center justify-center text-zinc-400">
                      <SourceFavicon url={source.url} className="size-4" />
                    </div>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        title={source.title}
                        className="truncate text-sm text-zinc-700 hover:underline underline-offset-2"
                      >
                        {source.title}
                      </a>
                    ) : (
                      <span
                        className="truncate text-sm text-zinc-700"
                        title={source.title}
                      >
                        {source.title}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-zinc-400">
                      {subtitle.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default Overview;
