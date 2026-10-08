/**
 * Laddex design tokens: the single source for values that JavaScript needs (chart series,
 * map layers, SVG fills). The same values are declared as CSS custom properties in
 * `src/styles/laddex.css`; `tokens.test.ts` fails if the two drift apart.
 *
 * Direction: "Weights & Measures". Paper and ink neutrals, palm-oil ember as the one
 * expressive colour, a cool tapioca slate to separate the second product family, and
 * ochre reserved for wholesale. Contrast ratios are checked in `tokens.test.ts`.
 */
export const color = {
  paper: "#F6F2EA",
  paper2: "#ECE6DA",
  card: "#FFFDF8",
  ink: "#1E1B17",
  ink2: "#4A453D",
  ink3: "#675F54",
  line: "#D9D1C2",
  lineStrong: "#B5AB97",

  ember: "#B23A0E",
  emberDeep: "#8A2A06",
  emberTint: "#F3DCCB",
  onEmber: "#FFF8F0",

  slate: "#2F5D6B",
  slateDeep: "#1F4350",
  slateTint: "#D6E4E8",

  ochre: "#E3B04B",
  ochreDeep: "#7A5200",
  ochreTint: "#F6E6BF",

  success: "#2E6B45",
  successTint: "#D9EBDF",
  warning: "#8A5A00",
  warningTint: "#F7E7C2",
  danger: "#A12525",
  dangerTint: "#F4D6D6",

  rail: "#1E1B17",
  railLine: "#38332C",
  railText: "#E9E2D3",
} as const;

/** Series colours. Every series is also distinguished by a pattern or label, never colour alone. */
export const chart = {
  palmOil: color.ember,
  tapioca: color.slate,
  retail: "#3F3A33",
  wholesale: "#C58F14",
  neutral: "#8C8374",
  prior: "#8C8374",
  grid: "#E4DDCE",
  /** Single-hue sequential ramp for normalised choropleths (low to high). */
  sequential: ["#FBEFE6", "#F0C9AB", "#DE8F5C", "#C25A22", "#8A2A06"],
  /** Categorical set for delivery zones. Always paired with a text label in the legend. */
  zones: ["#2F5D6B", "#B23A0E", "#B07F10", "#5E6B2F", "#6B3F5E"],
} as const;

export const map = {
  boundary: "#8C8374",
  boundaryStrong: "#1E1B17",
  selectFill: "#E3B04B",
  selectLine: "#1E1B17",
  hoverFill: "#F6E6BF",
  outsideFill: "#ECE6DA",
  sampleCoverageLine: "#2F5D6B",
  orderPoint: "#B23A0E",
  pickup: "#1E1B17",
  background: "#EDE8DE",
} as const;

export const font = {
  display: "'Fraunces Variable', Georgia, 'Times New Roman', serif",
  body: "'Hanken Grotesk Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

/** 4px base. */
export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const;

export const radius = { none: 0, sm: 2, md: 4, lg: 8 } as const;

export const container = { page: 1280, reading: 704, dashboard: "fluid" } as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  ease: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  /** Camera moves on the map: long enough to read, short enough not to block. */
  camera: 650,
} as const;

export const shadow = {
  rule: "0 1px 0 rgba(30, 27, 23, 0.08)",
  raised: "0 1px 2px rgba(30, 27, 23, 0.10), 0 4px 12px -6px rgba(30, 27, 23, 0.18)",
  pop: "0 10px 30px -12px rgba(30, 27, 23, 0.35)",
} as const;

/** WCAG relative luminance contrast, used by tests to keep the palette honest. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
