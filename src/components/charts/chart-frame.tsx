"use client";

import { useId, type ReactNode } from "react";

import { METRICS } from "@/features/spatial-intelligence/definitions";

/**
 * Shared chart chrome: title, a metric definition on demand, the unit and source line, and an
 * always-available table view so no chart relies on colour or hover alone.
 */
export function ChartFrame({ title, metric, unit, source = "Synthetic orders", children, table, className = "" }: { title: string; metric?: keyof typeof METRICS; unit?: string; source?: string; children: ReactNode; table?: ReactNode; className?: string }) {
  const id = useId();
  const def = metric ? METRICS[metric] : null;
  return (
    <figure className={`m-0 ${className}`} aria-labelledby={id}>
      <div className="flex items-start justify-between gap-2">
        <figcaption id={id} className="text-[0.8125rem] font-semibold text-ink leading-snug">{title}</figcaption>
        {def && (
          <details className="relative group shrink-0">
            <summary className="list-none text-xs text-ink-3 hover:text-ink underline underline-offset-4 min-h-6" aria-label={`How ${def.label} is calculated`}>How calculated</summary>
            <div className="absolute right-0 z-20 mt-1 w-72 panel shadow-pop p-3 text-xs space-y-1.5">
              <p className="font-semibold text-sm">{def.label}</p>
              <p className="text-ink-2">{def.definition}</p>
              <p className="mono text-ink-3">{def.formula}</p>
              {def.caveat && <p className="text-warning">{def.caveat}</p>}
            </div>
          </details>
        )}
      </div>
      <div className="mt-2">{children}</div>
      <p className="mono text-[0.625rem] text-ink-3 mt-1.5 uppercase tracking-wider">{[unit, source].filter(Boolean).join(" · ")}</p>
      {table && (
        <details className="mt-1">
          <summary className="text-xs text-ink-3 hover:text-ink underline underline-offset-4 cursor-pointer w-fit">Table view</summary>
          <div className="mt-2 max-h-56 overflow-auto border border-line rounded-sm">{table}</div>
        </details>
      )}
    </figure>
  );
}

export function Legend({ items }: { items: { label: string; color: string; hatch?: boolean; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2 list-none p-0 mt-1" aria-label="Legend">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <svg width="14" height="10" aria-hidden="true">
            {i.dashed ? <line x1="0" y1="5" x2="14" y2="5" stroke={i.color} strokeWidth="2" strokeDasharray="3 2" /> : <rect width="14" height="10" rx="1" fill={i.color} />}
           
          </svg>
          {i.label}
        </li>
      ))}
    </ul>
  );
}
