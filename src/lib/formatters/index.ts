/** Money is always held as integer kobo (1 NGN = 100 kobo) to avoid floating point drift. */
export type Kobo = number;

const grouped = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
const grouped2 = new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const NAIRA = "₦";

/** "₦72,000" for whole naira, "₦2,880.50" otherwise. */
export function formatNaira(kobo: Kobo | null | undefined, opts: { alwaysDecimals?: boolean } = {}): string {
  if (kobo === null || kobo === undefined || !Number.isFinite(kobo)) return "—";
  const sign = kobo < 0 ? "-" : "";
  const abs = Math.abs(kobo);
  const whole = abs % 100 === 0;
  return `${sign}${NAIRA}${whole && !opts.alwaysDecimals ? grouped.format(abs / 100) : grouped2.format(abs / 100)}`;
}

/** Compact naira for chart axes and dense KPI tiles: ₦1.2M, ₦480K. */
export function formatNairaCompact(kobo: Kobo | null | undefined): string {
  if (kobo === null || kobo === undefined || !Number.isFinite(kobo)) return "—";
  const n = Math.abs(kobo) / 100;
  const sign = kobo < 0 ? "-" : "";
  if (n >= 1e9) return `${sign}${NAIRA}${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`;
  if (n >= 1e6) return `${sign}${NAIRA}${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${sign}${NAIRA}${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return `${sign}${NAIRA}${Math.round(n)}`;
}

export function formatInt(n: number | null | undefined): string {
  return n === null || n === undefined || !Number.isFinite(n) ? "—" : grouped.format(n);
}

export function formatPercent(ratio: number | null | undefined, digits = 1): string {
  return ratio === null || ratio === undefined || !Number.isFinite(ratio) ? "—" : `${(ratio * 100).toFixed(digits)}%`;
}

/** Signed change such as "+12.4%". Null when there is no valid comparison. */
export function formatDelta(ratio: number | null | undefined, digits = 1): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return "—";
  const v = (ratio * 100).toFixed(digits);
  return `${ratio > 0 ? "+" : ""}${v}%`;
}

export type Unit = "ml" | "l" | "g" | "kg";

/** "25 L", "500 ml", "5 kg" */
export function formatSize(amount: number, unit: Unit): string {
  const u = unit === "l" ? "L" : unit;
  return `${amount} ${u}`;
}

export function unitSuffix(unit: "l" | "kg"): string {
  return unit === "l" ? "L" : "kg";
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });
export const formatDate = (iso: string | Date) => dateFmt.format(typeof iso === "string" ? new Date(iso) : iso);
export const formatDay = (iso: string | Date) => dayFmt.format(typeof iso === "string" ? new Date(iso) : iso);

export function formatDistanceKm(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}
