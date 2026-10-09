/** Lorenz curve against the line of perfect equality. Axes are shares, 0 to 100%. */
export function LorenzChart({
  points,
  gini,
}: {
  points: { x: number; y: number }[];
  gini: number | null;
}) {
  const W = 260;
  const H = 200;
  const m = { l: 34, r: 8, t: 8, b: 26 };
  const px = (x: number) => m.l + x * (W - m.l - m.r);
  const py = (y: number) => H - m.b - y * (H - m.t - m.b);
  const line = points
    .map(
      (p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`,
    )
    .join("");
  const area = `${line}L${px(1)} ${py(0)}L${px(0)} ${py(0)}Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Lorenz curve of sales across states${gini !== null ? `, Gini ${gini.toFixed(2)}` : ""}`}
      className="w-full h-auto"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={m.l}
            x2={W - m.r}
            y1={py(t)}
            y2={py(t)}
            stroke="var(--chart-grid)"
          />
          <text
            x={m.l - 4}
            y={py(t) + 3}
            textAnchor="end"
            fontSize="9"
            fill="var(--color-ink-3)"
          >
            {Math.round(t * 100)}%
          </text>
          <text
            x={px(t)}
            y={H - m.b + 12}
            textAnchor="middle"
            fontSize="9"
            fill="var(--color-ink-3)"
          >
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      <path d={area} fill="var(--chart-palm)" fillOpacity="0.14" />
      <line
        x1={px(0)}
        y1={py(0)}
        x2={px(1)}
        y2={py(1)}
        stroke="var(--color-ink-3)"
        strokeDasharray="4 3"
      />
      <path d={line} fill="none" stroke="var(--chart-palm)" strokeWidth="2" />
      <text
        x={W / 2}
        y={H - 2}
        textAnchor="middle"
        fontSize="9"
        fill="var(--color-ink-3)"
      >
        Share of states, lowest sales first
      </text>
      <text
        x={10}
        y={H / 2}
        fontSize="9"
        fill="var(--color-ink-3)"
        transform={`rotate(-90 10 ${H / 2})`}
        textAnchor="middle"
      >
        Share of sales
      </text>
    </svg>
  );
}
