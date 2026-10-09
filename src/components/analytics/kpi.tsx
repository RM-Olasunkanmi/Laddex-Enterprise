import { Sparkline } from "@/components/charts/sparkline";
import { METRICS } from "@/features/spatial-intelligence/definitions";
import { change } from "@/features/spatial-intelligence/metrics";
import { formatDelta } from "@/lib/formatters";

/** Number tile with period-over-period change. Delta is shown only when a valid previous period exists. */
export function KpiTile({
  metric,
  value,
  current,
  previous,
  spark,
  invertGood = false,
  note,
}: {
  metric: keyof typeof METRICS;
  value: string;
  current: number | null;
  previous: number | null;
  spark?: number[];
  invertGood?: boolean;
  note?: string;
}) {
  const def = METRICS[metric];
  const d = change(current, previous);
  const good =
    d === null || Math.abs(d) < 0.005 ? null : invertGood ? d < 0 : d > 0;
  return (
    <div className="panel p-3 relative" data-metric={metric}>
      <details className="absolute right-2 top-2 group">
        <summary
          className="list-none grid place-items-center w-6 h-6 rounded-full border border-line-strong text-[0.6875rem] text-ink-3 hover:text-ink hover:border-ink cursor-pointer"
          aria-label={`How ${def.label} is calculated`}
        >
          i
        </summary>
        <div className="absolute right-0 z-30 mt-1 w-64 panel shadow-pop p-3 text-xs space-y-1.5">
          <p className="font-semibold text-sm">{def.label}</p>
          <p className="text-ink-2">{def.definition}</p>
          <p className="mono text-ink-3">{def.formula}</p>
          {def.caveat && <p className="text-warning">{def.caveat}</p>}
        </div>
      </details>
      <p className="text-[0.6875rem] text-ink-3 pr-6 leading-tight min-h-[1.5rem]">
        {def.label}
      </p>
      <p
        className="mono text-xl font-medium mt-1 leading-none"
        data-testid="kpi-value"
      >
        {value}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 min-h-[1.25rem]">
        <p
          className={`mono text-[0.6875rem] ${good === null ? "text-ink-3" : good ? "text-success" : "text-danger"}`}
          title="Change versus the previous period of equal length"
        >
          {d === null ? (
            "no prior data"
          ) : (
            <>
              <span aria-hidden="true">{d > 0 ? "▲" : d < 0 ? "▼" : "▬"} </span>
              {formatDelta(d)}
              <span className="sr-only"> versus previous period</span>
            </>
          )}
        </p>
        {spark && <Sparkline values={spark} className="w-16 h-5" />}
      </div>
      {note && <p className="text-[0.625rem] text-ink-3 mt-1">{note}</p>}
    </div>
  );
}
