/** Pulsing dots shown while waiting for the first token of a reply. */
const Thinking = () => (
  <div className="flex items-center gap-1 text-zinc-400">
    <span className="size-2 rounded-full bg-zinc-300 animate-pulse" />
    <span className="size-2 rounded-full bg-zinc-300 animate-pulse [animation-delay:150ms]" />
    <span className="size-2 rounded-full bg-zinc-300 animate-pulse [animation-delay:300ms]" />
  </div>
);

export default Thinking;
