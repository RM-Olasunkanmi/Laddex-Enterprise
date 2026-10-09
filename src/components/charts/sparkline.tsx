import { color } from "@/lib/design/tokens";

/** Compact trend for a KPI tile. Decorative: the figure beside it carries the information. */
export function Sparkline({
  values,
  className = "",
}: {
  values: number[];
  className?: string;
}) {
  if (values.length < 2 || Math.max(...values) <= 0) return null;
  const W = 80;
  const H = 24;
  const max = Math.max(...values);
  const d = values
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${((i / (values.length - 1)) * W).toFixed(1)},${(H - 2 - (v / max) * (H - 4)).toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={d}
        fill="none"
        stroke={color.ink2}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
