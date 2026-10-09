"use client";

import { chart, v as color } from "@/lib/design/tokens";

export interface HBarDatum {
  id: string;
  label: string;
  value: number;
  /** Text printed at the end of the bar, already formatted. */
  display: string;
  selected?: boolean;
  fill?: string;
  hatch?: boolean;
}

/**
 * Horizontal bars for comparison. One zero baseline, labels at the left, value at the end of
 * each bar, 4px rounded data-end. Rows are buttons when `onSelect` is given so the chart is keyboard-operable.
 */
export function HBarChart({
  data,
  onSelect,
  max,
  empty = "No data for these filters",
  ariaLabel,
}: {
  data: HBarDatum[];
  onSelect?: (id: string) => void;
  max?: number;
  empty?: string;
  ariaLabel: string;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0))
    return <p className="text-sm text-ink-3 py-6 text-center">{empty}</p>;
  const top = max ?? Math.max(...data.map((d) => d.value));
  return (
    <ul className="space-y-1 list-none p-0" aria-label={ariaLabel}>
      {data.map((d) => {
        const pct =
          top > 0 ? Math.max(d.value > 0 ? 1.5 : 0, (d.value / top) * 100) : 0;
        const inner = (
          <>
            <span
              className="w-28 shrink-0 truncate text-left text-xs text-ink-2"
              title={d.label}
            >
              {d.label}
            </span>
            <span className="relative flex-1 h-4" aria-hidden="true">
              <span className="absolute inset-y-0 left-0 border-l border-ink/40" />
              <span
                className="absolute inset-y-0.5 left-px rounded-r-[4px]"
                style={{
                  width: `${pct}%`,
                  background: d.fill ?? chart.neutral,
                  backgroundImage: d.hatch
                    ? "repeating-linear-gradient(45deg, rgba(255,253,248,.55) 0 2px, transparent 2px 6px)"
                    : undefined,
                  outline: d.selected ? `2px solid ${color.ink}` : undefined,
                  outlineOffset: 1,
                }}
              />
            </span>
            <span className="w-16 shrink-0 text-right mono text-xs">
              {d.display}
            </span>
          </>
        );
        return (
          <li key={d.id}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(d.id)}
                aria-pressed={!!d.selected}
                className={`w-full flex items-center gap-2 min-h-7 rounded-sm hover:bg-paper-2 ${d.selected ? "bg-ochre-tint/70" : ""}`}
              >
                {inner}
              </button>
            ) : (
              <div className="flex items-center gap-2 min-h-7">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
