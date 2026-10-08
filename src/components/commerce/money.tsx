import { formatNaira } from "@/lib/formatters";
import type { Kobo } from "@/lib/formatters";

export function Price({ kobo, className }: { kobo: Kobo | null; className?: string }) {
  return <span className={`num ${className ?? ""}`}>{formatNaira(kobo)}</span>;
}

/** "₦3,400 / L": unit price lines are always mono so columns of them align. */
export function UnitPrice({ kobo, unit, className }: { kobo: Kobo | null; unit: "l" | "kg"; className?: string }) {
  return (
    <span className={`mono text-[0.8125rem] text-ink-3 ${className ?? ""}`}>
      {formatNaira(kobo)} / {unit === "l" ? "L" : "kg"}
    </span>
  );
}
