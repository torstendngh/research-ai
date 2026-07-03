import LogoIcon from "@/components/shared/icons/logo-icon";

/** Centered placeholder shown when there is no chat content to display. */
const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-4 flex-1 items-center justify-center p-4 text-center text-sm text-zinc-400">
    <LogoIcon className="size-16 text-zinc-200"/>
    {children}
  </div>
);

export default EmptyState;
