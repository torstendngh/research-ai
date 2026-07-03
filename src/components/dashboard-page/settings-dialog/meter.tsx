import { cn } from "@/lib/tailwind-utils";
import type { UsageMeter } from "@/lib/usage";

function resetLabel(resetsAt: string): string {
  return `Resets ${new Date(resetsAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

export const MeterBar = ({ ratio }: { ratio: number }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
    <div
      className={cn(
        "h-full rounded-full transition-[width]",
        ratio >= 1 ? "bg-red-500" : ratio >= 0.8 ? "bg-amber-500" : "bg-zinc-900",
      )}
      style={{ width: `${Math.min(1, ratio) * 100}%` }}
    />
  </div>
);

export const MeterRow = ({ label, meter }: { label: string; meter: UsageMeter }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm text-zinc-700">{label}</span>
      <span className="text-xs tabular-nums text-zinc-400">
        {meter.used} / {meter.limit}
      </span>
    </div>
    <MeterBar ratio={meter.limit > 0 ? meter.used / meter.limit : 0} />
    <span className="text-xs text-zinc-400">{resetLabel(meter.resetsAt)}</span>
  </div>
);
