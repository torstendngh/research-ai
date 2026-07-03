import { cn } from "@/lib/tailwind-utils";
import { useId } from "react";

interface DotPatternProps {
  /** Tile size — distance between dots, in px. */
  width?: number;
  height?: number;
  /** Dot position within each tile. */
  cx?: number;
  cy?: number;
  /** Dot radius. */
  cr?: number;
  /** Offset of the whole tile grid, in px (negative x = left, positive y = down). */
  x?: number;
  y?: number;
  className?: string;
}

/**
 * A tiled grid of dots, rendered as a repeating SVG pattern. Meant to sit in an
 * absolutely-positioned background; control the colour via `fill-*` and fade it
 * with a `mask-image` utility in `className`.
 */
const DotPattern = ({
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
  x = 0,
  y = 0,
  className,
}: DotPatternProps) => {
  const id = useId();

  return (
    <svg
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-zinc-300",
        className,
      )}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};

export default DotPattern;
