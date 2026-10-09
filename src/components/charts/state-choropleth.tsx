import { NG_SKETCH } from "@/lib/geo/ng-sketch.generated";

/** Centre of a path's bounding box, parsed from its "M x y L x y ..." string. Cached per state. */
const centres = new Map<string, [number, number]>();
function centreOf(id: string, d: string): [number, number] {
  let c = centres.get(id);
  if (!c) {
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    for (const m of d.matchAll(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g)) {
      const x = Number(m[1]);
      const y = Number(m[2]);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    c = [(x0 + x1) / 2, (y0 + y1) / 2];
    centres.set(id, c);
  }
  return c;
}

export interface ChoroplethCell {
  /** CSS colour (a var() reference so the map follows the theme). */
  fill: string;
  /** Plain-text description used in the tooltip and by screen readers. */
  title: string;
  /** Short mark drawn on the state (for example HH), so class never relies on colour alone. */
  mark?: string;
}

/**
 * Static, server-renderable outline of Nigeria's states. Used for statistics maps where the
 * point is the pattern rather than panning and zooming. Each state carries a <title>.
 */
export function StateChoropleth({
  cells,
  ariaLabel,
  className = "",
  onSelect,
  selectedId,
}: {
  cells: Map<string, ChoroplethCell>;
  ariaLabel: string;
  className?: string;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  return (
    <svg
      viewBox={`0 0 ${NG_SKETCH.width} ${NG_SKETCH.height}`}
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      {NG_SKETCH.states.map((s) => {
        const cell = cells.get(s.id);
        return (
          <path
            key={s.id}
            d={s.d}
            fill={cell?.fill ?? "var(--color-paper-2)"}
            stroke={
              selectedId === s.id ? "var(--color-ink)" : "var(--color-ink)"
            }
            strokeOpacity={selectedId === s.id ? 1 : 0.45}
            strokeWidth={selectedId === s.id ? 2 : 0.7}
            onClick={onSelect ? () => onSelect(s.id) : undefined}
            style={onSelect ? { cursor: "pointer" } : undefined}
          >
            <title>{cell?.title ?? s.id}</title>
          </path>
        );
      })}
      {NG_SKETCH.states.map((s) => {
        const mark = cells.get(s.id)?.mark;
        if (!mark) return null;
        const [x, y] = centreOf(s.id, s.d);
        return (
          <text
            key={`m-${s.id}`}
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--color-ink)"
            stroke="var(--color-paper)"
            strokeWidth="3"
            paintOrder="stroke"
            pointerEvents="none"
          >
            {mark}
          </text>
        );
      })}
    </svg>
  );
}
