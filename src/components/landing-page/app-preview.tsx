"use client";

import { useState, SVGProps, ComponentType } from "react";
import Image from "next/image";
import LogoIcon from "@/components/shared/icons/logo-icon";
import SourcesIcon from "@/components/shared/icons/sources-icon";
import ChatIcon from "@/components/shared/icons/chat-icon";
import MindMapIcon from "@/components/shared/icons/mind-map-icon";

type Shot = {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  src: string;
  alt: string;
};

const shots: Shot[] = [
  {
    id: "sources",
    label: "Sources",
    description: "Upload PDFs or let AI find the best sources on any topic.",
    icon: SourcesIcon,
    src: "/marketing/sources.png",
    alt: "ResearchAI sources view with AI-suggested sources for a topic",
  },
  {
    id: "chat",
    label: "Chat",
    description: "Ask anything and get answers grounded in your material.",
    icon: ChatIcon,
    src: "/marketing/chat.png",
    alt: "ResearchAI chat answering a question with citations from your sources",
  },
  {
    id: "mindmap",
    label: "Mind map",
    description: "See how every idea connects on an interactive canvas.",
    icon: MindMapIcon,
    src: "/marketing/mindmap.png",
    alt: "ResearchAI interactive mind map generated from your sources",
  },
];

/**
 * A framed preview of the real ResearchAI workspace. A pill tab bar above the
 * frame switches between the marketing screenshots.
 */
const AppPreview = () => {
  const [active, setActive] = useState(shots[1].id);
  const current = shots.find((s) => s.id === active) ?? shots[0];

  return (
    <div className="flex w-full flex-col items-start">
      {/* tabs */}
      <div className="grid w-full gap-3 sm:grid-cols-3">
        {shots.map(({ id, label, description, icon: Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`group flex flex-col gap-1.5 rounded-2xl p-5 text-left text-zinc-900 transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-white shadow-xl shadow-zinc-900/10 -translate-y-0.5"
                  : "bg-white/60 hover:border-zinc-300 hover:bg-white hover:shadow-md hover:shadow-zinc-900/5"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200"
                  }`}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="text-base font-medium tracking-tight">
                  {label}
                </span>
              </span>
              <span className="text-sm tracking-tight text-balance text-zinc-500">
                {description}
              </span>
            </button>
          );
        })}
      </div>

      {/* framed screenshot */}
      <div className="mt-5 w-full rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center gap-2 px-4 h-10 border-b border-zinc-100 bg-zinc-50">
          <span className="size-3 rounded-full bg-zinc-200" />
          <span className="size-3 rounded-full bg-zinc-200" />
          <span className="size-3 rounded-full bg-zinc-200" />
          <div className="ml-2 flex items-center gap-1.5 text-zinc-400">
            <LogoIcon className="size-3.5" />
            <span className="text-xs font-medium tracking-tight">
              ResearchAI
            </span>
          </div>
        </div>

        {/* screenshot */}
        <div className="relative aspect-[3808/1894] bg-zinc-50">
          <Image
            key={current.id}
            src={current.src}
            alt={current.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1024px"
            className="object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
};

export default AppPreview;
