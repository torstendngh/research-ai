import { SVGProps, ComponentType } from "react";
import CenterContent from "./center-content";
import SourcesIcon from "@/components/shared/icons/sources-icon";
import MindMapIcon from "@/components/shared/icons/mind-map-icon";
import FlashCardsIcon from "@/components/shared/icons/flash-cards-icon";
import PodcastIcon from "@/components/shared/icons/podcast-icon";
import AiSearchIcon from "@/components/shared/icons/ai-search-icon";
import CardsIcon from "@/components/shared/icons/cards-icon";

type Feature = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: SourcesIcon,
    title: "Bring your own sources",
    description:
      "Upload PDFs, drop in a link or paste your notes. Everything you add becomes the ground truth for your project.",
  },
  {
    icon: MindMapIcon,
    title: "Instant mind maps",
    description:
      "See how ideas connect. ResearchAI lays out the structure of your material as an interactive, zoomable map.",
  },
  {
    icon: FlashCardsIcon,
    title: "Flashcards & quizzes",
    description:
      "Generate flashcards and quizzes from your reading to test yourself and remember what actually matters.",
  },
  {
    icon: PodcastIcon,
    title: "Listen as a podcast",
    description:
      "Turn dense papers into a natural, spoken summary you can listen to on a walk or between meetings.",
  },
  {
    icon: AiSearchIcon,
    title: "Grounded answers",
    description:
      "Ask anything and get answers cited from your own material — no hallucinated sources, no guessing.",
  },
  {
    icon: CardsIcon,
    title: "One project per topic",
    description:
      "Keep every subject organized. Each project holds its own sources, maps and study tools in one place.",
  },
];

const Features = () => {
  return (
    <CenterContent id="features" className="scroll-mt-24">
      <span className="mb-4 font-medium tracking-tight text-zinc-400">
        How it works
      </span>
      <h2 className="md:text-5xl text-3xl tracking-tighter md:max-w-2/3 text-balance mb-16 text-zinc-900">
        Everything you need to{" "}
        <span className="font-display italic tracking-normal">actually learn</span> a subject.
      </h2>

      <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-x-8 gap-y-12">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col">
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Icon className="size-5" />
            </div>
            <h3 className="text-lg font-medium tracking-tight text-zinc-900 mb-2">
              {title}
            </h3>
            <p className="text-base tracking-tight text-zinc-500 text-balance">
              {description}
            </p>
          </div>
        ))}
      </div>
    </CenterContent>
  );
};

export default Features;
