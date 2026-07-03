import LoadingIcon from "@/components/shared/icons/loading-icon";

export const CenteredLoader = () => (
  <div className="flex flex-1 items-center justify-center py-10">
    <LoadingIcon className="size-5 animate-spin text-zinc-400" />
  </div>
);

export const LoadFailedNotice = () => (
  <p className="py-10 text-center text-sm text-zinc-400">Couldn&apos;t load usage.</p>
);
