import { REGIONS } from "@/fixtures/geography/regions";
import { NG_SKETCH } from "@/lib/geo/ng-sketch.generated";

const FILLS = [
  "var(--chart-palm)",
  "var(--chart-tapioca)",
  "var(--chart-garri)",
  "var(--chart-retail)",
  "var(--chart-wholesale)",
  "var(--chart-events)",
];

/**
 * Static, server-rendered outline of Nigeria's 36 states and the FCT, shaded by delivery region.
 * Real simplified boundaries, no JavaScript, no map library.
 */
export function RegionSketch({
  className = "",
  showLegend = true,
}: {
  className?: string;
  showLegend?: boolean;
}) {
  const regionIdx = (id: string) =>
    REGIONS.findIndex((r) => r.stateIds.includes(id));
  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${NG_SKETCH.width} ${NG_SKETCH.height}`}
        role="img"
        aria-label="Outline of Nigeria's states shaded by the six delivery regions: South West, South East, South South, North Central, North West and North East."
        className="w-full h-auto"
      >
        {NG_SKETCH.states.map((s) => (
          <path
            key={s.id}
            className="path-in"
            style={{ ["--i" as string]: Math.max(0, regionIdx(s.id)) }}
            d={s.d}
            fill={FILLS[regionIdx(s.id)] ?? "var(--color-paper-2)"}
            fillOpacity={0.55}
            stroke="var(--color-ink)"
            strokeOpacity={0.5}
            strokeWidth="0.7"
          />
        ))}
      </svg>
      {showLegend && (
        <figcaption className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
          {REGIONS.map((r, i) => (
            <span key={r.id} className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="w-3 h-3 rounded-[1px] border border-ink/40"
                style={{ background: FILLS[i], opacity: 0.7 }}
              />
              {r.name} <span className="text-ink-3">({r.stateIds.length})</span>
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
