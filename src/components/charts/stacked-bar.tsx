import { chart } from "@/lib/design/tokens";

export interface Segment {
  key: string;
  label: string;
  value: number;
  display: string;
  fill: string;
  hatch?: boolean;
}

/** One 100% bar. 2px surface gaps between segments; labels beneath so identity never depends on colour alone. */
export function StackedBar({
  segments,
  ariaLabel,
}: {
  segments: Segment[];
  ariaLabel: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!(total > 0))
    return (
      <p className="text-sm text-ink-3 py-4 text-center">
        No sales in this selection
      </p>
    );
  return (
    <div>
      <div
        className="flex h-5 gap-[2px]"
        role="img"
        aria-label={`${ariaLabel}: ${segments.map((s) => `${s.label} ${s.display}`).join(", ")}`}
      >
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.key}
              title={`${s.label}: ${s.display}`}
              className="first:rounded-l-[4px] last:rounded-r-[4px]"
              style={{
                width: `${(s.value / total) * 100}%`,
                background: s.fill,
                backgroundImage: s.hatch
                  ? "repeating-linear-gradient(45deg, rgba(255,253,248,.55) 0 2px, transparent 2px 6px)"
                  : undefined,
                minWidth: 3,
              }}
            />
          ))}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs list-none p-0">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="w-3 h-3 rounded-[2px] shrink-0"
              style={{
                background: s.fill,
                backgroundImage: s.hatch
                  ? "repeating-linear-gradient(45deg, rgba(255,253,248,.55) 0 2px, transparent 2px 6px)"
                  : undefined,
              }}
            />
            <span className="text-ink-2">{s.label}</span>
            <span className="mono ml-auto">{s.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const SERIES = {
  palm: chart.palmOil,
  tapioca: chart.tapioca,
  retail: chart.retail,
  wholesale: chart.wholesale,
};
