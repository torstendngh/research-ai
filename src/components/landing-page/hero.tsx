"use client";

import CenterContent from "./center-content";
import AppPreview from "./app-preview";
import DotPattern from "@/components/shared/dot-pattern";
import LogoIcon from "@/components/shared/icons/logo-icon";
import ArrowRightIcon from "@/components/shared/icons/arrow-right-icon";

const Hero = () => {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative pt-8">
      {/* dotted backdrop, fading out towards the preview */}
      <DotPattern className="fill-zinc-200 -z-10 h-[36rem] [mask-image:radial-gradient(ellipse_60%_100%_at_50%_0%,black,transparent)]" />

      <CenterContent className="items-center text-center pt-8">
        <span className="mb-8 flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-sm font-medium tracking-tight text-zinc-600 shadow-sm backdrop-blur">
          <LogoIcon className="size-4 text-zinc-900" />
          ResearchAI — your AI research workspace
        </span>

        <h1 className="md:text-7xl text-4xl tracking-tighter md:max-w-3/4 text-balance mb-6 text-zinc-900">
          Turn any source into{" "}
          <span className="font-display italic tracking-normal">
            understanding
          </span>
          .
        </h1>

        <p className="text-lg tracking-tight max-w-150 mb-10 text-balance text-zinc-500">
          Drop in your papers, PDFs and links. ResearchAI reads them and builds
          mind maps, flashcards, quizzes and podcasts — then answers every
          question, grounded in your sources.
        </p>

        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="group px-6 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-full font-medium tracking-tight cursor-pointer transition-colors flex items-center gap-1.5 shadow-lg shadow-zinc-900/10"
          >
            Start researching
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <button
            onClick={scrollToFeatures}
            className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 rounded-full font-medium tracking-tight cursor-pointer transition-colors"
          >
            See how it works
          </button>
        </div>

        <span className="mt-4 mb-16 text-sm tracking-tight text-zinc-400">
          Free to get started · No credit card required
        </span>

        {/* preview with a soft glow behind it */}
        <div className="relative w-full">
          <div
            aria-hidden
            className="absolute -inset-x-8 -top-8 bottom-1/3 -z-10 rounded-[3rem] bg-zinc-400/25 blur-3xl"
          />
          <AppPreview />
        </div>
      </CenterContent>
    </div>
  );
};

export default Hero;
