import CenterContent from "./center-content";
import DotPattern from "@/components/shared/dot-pattern";
import ArrowRightIcon from "@/components/shared/icons/arrow-right-icon";

const Cta = () => {
  return (
    <CenterContent>
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900 px-8 py-20 flex flex-col items-center text-center">
        <DotPattern className="fill-zinc-800 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />

        <h2 className="relative md:text-5xl text-3xl tracking-tighter text-white text-balance mb-6 max-w-2xl">
          Start understanding your{" "}
          <span className="font-display italic tracking-normal">sources</span> today.
        </h2>
        <p className="relative text-lg tracking-tight text-zinc-400 max-w-lg text-balance mb-8">
          Create your first project in seconds. Sign in with Google — no setup
          required.
        </p>
        <a
          href="/login"
          className="relative px-6 py-2.5 bg-white text-zinc-900 hover:bg-zinc-100 rounded-full font-medium tracking-tight cursor-pointer transition-colors flex items-center gap-1.5"
        >
          Get started for free
          <ArrowRightIcon className="size-4" />
        </a>
      </div>
    </CenterContent>
  );
};

export default Cta;
