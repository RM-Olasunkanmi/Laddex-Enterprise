"use client";

import { useRef, useState } from "react";

import { chart, color } from "@/lib/design/tokens";
import { formatDay, formatNairaCompact, formatNaira } from "@/lib/formatters";

import { niceMax, ticks } from "./scales";

export interface LinePoint {
  date: string;
  value: number;
}

/**
 * Trend line with an optional dashed prior-period overlay. The y axis starts at zero.
 * Hover (or arrow keys) reads out the exact bucket value and the prior-period value for the same position.
 */
export function LineChart({ series, prior, bucketLabel, height = 150 }: { series: LinePoint[]; prior?: LinePoint[]; bucketLabel: string; height?: number }) {
  const W = 360;
  const m = { l: 44, r: 8, t: 10, b: 22 };
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const n = series.length;
  const max = niceMax(Math.max(1, ...series.map((p) => p.value), ...(prior ?? []).map((p) => p.value)));
  const x = (i: number) => m.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - m.l - m.r));
  const y = (v: number) => height - m.b - (v / max) * (height - m.t - m.b);
  const path = (pts: LinePoint[]) => pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || n === 0) return;
    const px = ((clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((px - m.l) / (W - m.l - m.r)) * (n - 1)))));
  };
  const h = hover !== null ? series[hover] : null;
  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${height}`}
        className="w-full h-auto touch-pan-y"
        role="img"
        aria-label={`Gross sales by ${bucketLabel}. Peak ${formatNaira(Math.max(...series.map((p) => p.value)))}.`}
        tabIndex={0}
        onPointerMove={(e) => move(e.clientX)}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setHover((v) => Math.min(n - 1, (v ?? -1) + 1));
          if (e.key === "ArrowLeft") setHover((v) => Math.max(0, (v ?? n) - 1));
          if (e.key === "Escape") setHover(null);
        }}
        onBlur={() => setHover(null)}
      >
        {ticks(max, 3).map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke={chart.grid} />
            <text x={m.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono)" fill={color.ink3}>{formatNairaCompact(t)}</text>
          </g>
        ))}
        {[0, Math.floor((n - 1) / 2), n - 1].filter((i, k, a) => i >= 0 && a.indexOf(i) === k).map((i) => (
          <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="9.5" fontFamily="var(--font-mono)" fill={color.ink3}>{series[i] ? formatDay(series[i].date) : ""}</text>
        ))}
        {prior && prior.length > 0 && <path d={path(prior)} fill="none" stroke={chart.prior} strokeWidth="1.5" strokeDasharray="4 3" />}
        {n > 0 && <path d={path(series)} fill="none" stroke={color.ember} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {h && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={height - m.b} stroke={color.ink} strokeOpacity="0.5" />
            <circle cx={x(hover)} cy={y(h.value)} r="4.5" fill={color.ember} stroke="#FFFDF8" strokeWidth="2" />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div className="pointer-events-none absolute top-0 panel shadow-raised px-2.5 py-1.5 text-xs" style={{ left: `${Math.min(70, Math.max(0, (x(hover) / W) * 100 - 14))}%` }} role="status">
          <p className="mono text-ink-3">{formatDay(h.date)}{bucketLabel === "week" ? " (week from)" : ""}</p>
          <p className="font-semibold">{formatNaira(h.value)}</p>
          {prior && prior[hover] && <p className="text-ink-3">Prior period: {formatNaira(prior[hover].value)}</p>}
        </div>
      )}
    </div>
  );
}
