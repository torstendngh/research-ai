import type { UsageSummary } from "@/lib/usage";
import { MeterBar } from "./meter";
import { CenteredLoader, LoadFailedNotice } from "./placeholders";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** Storage usage: total meter plus the source/audio breakdown. */
const StorageTab = ({
  usage,
  loadFailed,
}: {
  usage: UsageSummary | null;
  loadFailed: boolean;
}) => {
  if (loadFailed) return <LoadFailedNotice />;
  if (!usage) return <CenteredLoader />;

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-zinc-700">Total used</span>
          <span className="text-xs tabular-nums text-zinc-400">
            {formatBytes(usage.storage.usedBytes)} /{" "}
            {formatBytes(usage.storage.limitBytes)}
          </span>
        </div>
        <MeterBar
          ratio={usage.storage.usedBytes / usage.storage.limitBytes}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-zinc-500">Sources</span>
          <span className="text-xs tabular-nums text-zinc-400">
            {formatBytes(usage.storage.sourceBytes)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-zinc-500">Podcast audio</span>
          <span className="text-xs tabular-nums text-zinc-400">
            {formatBytes(usage.storage.audioBytes)}
          </span>
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        Delete sources or podcast episodes to free up space.
      </p>
    </>
  );
};

export default StorageTab;
