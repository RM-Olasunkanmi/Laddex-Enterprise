import { niceMax } from "./scales";

import { chart, v as color } from "@/lib/design/tokens";
import { formatNairaCompact, formatNaira } from "@/lib/formatters";

export function Histogram({
  bins,
  median,
  p90,
  n,
}: {
  bins: { from: number; to: number; count: number }[];
  median: number | null;
  p90: number | null;
  n: number;
}) {
  if (!n)
    return (
      <p className="text-sm text-ink-3 py-6 text-center">
        No delivery orders in this selection
      </p>
    );
  const W = 360;
  const H = 120;
  const m = { l: 30, r: 6, t: 8, b: 24 };
  const max = niceMax(Math.max(...bins.map((b) => b.count)));
  const bw = (W - m.l - m.r) / bins.length;
  const last = bins[bins.length - 1].to;
  const xv = (v: number) => m.l + (Math.min(v, last) / last) * (W - m.l - m.r);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Delivery fee distribution for ${n} orders. Median ${formatNaira(median)}, 90th percentile ${formatNaira(p90)}.`}
    >
      {[0, max / 2, max].map((t) => (
        <g key={t}>
          <line
            x1={m.l}
            x2={W - m.r}
            y1={H - m.b - (t / max) * (H - m.t - m.b)}
            y2={H - m.b - (t / max) * (H - m.t - m.b)}
            stroke={chart.grid}
          />
          <text
            x={m.l - 5}
            y={H - m.b - (t / max) * (H - m.t - m.b) + 3}
            textAnchor="end"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill={color.ink3}
          >
            {Math.round(t)}
          </text>
        </g>
      ))}
      {bins.map((b, i) => {
        const h = (b.count / max) * (H - m.t - m.b);
        return (
          <g key={b.from}>
            <rect
              x={m.l + i * bw + 1}
              y={H - m.b - h}
              width={Math.max(1, bw - 2)}
              height={h}
              rx="2"
              fill={chart.neutral}
            >
              <title>{`${formatNaira(b.from)} to ${formatNaira(b.to)}: ${b.count} orders`}</title>
            </rect>
            {i % 2 === 0 && (
              <text
                x={m.l + i * bw}
                y={H - 8}
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill={color.ink3}
              >
                {formatNairaCompact(b.from)}
              </text>
            )}
          </g>
        );
      })}
      {median !== null && (
        <line
          x1={xv(median)}
          x2={xv(median)}
          y1={m.t}
          y2={H - m.b}
          stroke={color.ink}
          strokeWidth="1.5"
        />
      )}
      {p90 !== null && (
        <line
          x1={xv(p90)}
          x2={xv(p90)}
          y1={m.t}
          y2={H - m.b}
          stroke={color.ember}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      )}
    </svg>
  );
}
