import type { Kobo } from "@/lib/formatters";

import { formatNaira } from "@/lib/formatters";

export function Price({
  kobo,
  className,
}: {
  kobo: Kobo | null;
  className?: string;
}) {
  return <span className={`num ${className ?? ""}`}>{formatNaira(kobo)}</span>;
}

/** "₦3,400 per L": tabular figures so columns of them align. */
export function UnitPrice({
  kobo,
  unit,
  className,
}: {
  kobo: Kobo | null;
  unit: "l" | "kg";
  className?: string;
}) {
  return (
    <span className={`num text-[0.8125rem] text-ink-3 ${className ?? ""}`}>
      {formatNaira(kobo)} per {unit === "l" ? "litre" : "kg"}
    </span>
  );
}
