import type { PackVariant } from "@/features/catalogue/types";

import { tierSaving } from "@/features/catalogue/pricing";
import { chart, v as color } from "@/lib/design/tokens";
import {
  formatNaira,
  formatNairaCompact,
  formatPercent,
} from "@/lib/formatters";

/**
 * Step chart of price per pack against order quantity. The y axis starts at zero so the
 * size of each discount is not exaggerated. Reads as a table too (see the visible list below it).
 */
export function TierChart({
  variant,
  activeQty,
  className = "",
}: {
  variant: PackVariant;
  activeQty?: number;
  className?: string;
}) {
  const tiers = [...variant.wholesaleTiers].sort((a, b) => a.minQty - b.minQty);
  if (!tiers.length) return null;
  const W = 520;
  const H = 190;
  const m = { l: 56, r: 12, t: 16, b: 34 };
  const steps = [
    { minQty: 1, unitPriceKobo: variant.retailPriceKobo },
    ...tiers,
  ];
  const maxQty = Math.max(tiers[tiers.length - 1].minQty * 1.35, 10);
  const x = (q: number) =>
    m.l + (Math.log(q) / Math.log(maxQty)) * (W - m.l - m.r);
  const y = (p: number) =>
    H - m.b - (p / variant.retailPriceKobo) * (H - m.t - m.b);
  let d = "";
  steps.forEach((s, i) => {
    const x0 = x(s.minQty);
    const x1 = x(i + 1 < steps.length ? steps[i + 1].minQty : maxQty);
    d += `${i === 0 ? "M" : "L"}${x0},${y(s.unitPriceKobo)} L${x1},${y(s.unitPriceKobo)} `;
  });
  const ticks = [0, 0.5, 1].map((f) => f * variant.retailPriceKobo);
  return (
    <figure className={`m-0 ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Indicative price per pack by quantity for the ${variant.size.amount} ${variant.size.unit} pack`}
        className="w-full h-auto"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={m.l}
              x2={W - m.r}
              y1={y(t)}
              y2={y(t)}
              stroke={chart.grid}
            />
            <text
              x={m.l - 8}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill={color.ink3}
            >
              {formatNairaCompact(t)}
            </text>
          </g>
        ))}
        <path d={d} fill="none" stroke={color.ink} strokeWidth="2" />
        {steps.map((s, i) => (
          <g key={s.minQty}>
            <circle
              cx={x(s.minQty)}
              cy={y(s.unitPriceKobo)}
              r="3.5"
              fill={color.paper}
              stroke={color.ink}
              strokeWidth="2"
            />
            <text
              x={x(s.minQty)}
              y={H - m.b + 16}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill={color.ink2}
            >
              {i === 0 ? "1" : `${s.minQty}+`}
            </text>
          </g>
        ))}
        {activeQty ? (
          <line
            x1={x(Math.min(activeQty, maxQty))}
            x2={x(Math.min(activeQty, maxQty))}
            y1={m.t}
            y2={H - m.b}
            stroke={color.ember}
            strokeDasharray="4 3"
            strokeWidth="1.5"
          />
        ) : null}
        <text
          x={(m.l + W - m.r) / 2}
          y={H - 4}
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={color.ink3}
        >
          packs per order (log scale)
        </text>
      </svg>
      <figcaption className="sr-only">
        Price breaks:{" "}
        {steps
          .map((s) => `${s.minQty}+ packs at ${formatNaira(s.unitPriceKobo)}`)
          .join("; ")}
      </figcaption>
      <ul className="mt-3 grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-1 text-sm mono list-none p-0">
        {steps.map((s, i) => (
          <li key={s.minQty} className="contents">
            <span className="text-ink-3">
              {i === 0 ? "1+" : `${s.minQty}+`}
            </span>
            <span>{formatNaira(s.unitPriceKobo)} per pack</span>
            <span className="text-ink-3 text-right">
              {i === 0
                ? "list"
                : `-${formatPercent(tierSaving(variant, s), 0)}`}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
