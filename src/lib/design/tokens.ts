/**
 * Laddex design tokens: the single source for values JavaScript needs (map paint, tests, docs).
 * The same values are declared as CSS custom properties in `src/styles/laddex.css`, where the
 * UI reads them, so SVG charts and components switch theme without re-rendering.
 * `tokens.test.ts` fails if the two drift apart or a contrast pair drops below its target.
 *
 * Brand colours come from the Laddex logo and packaging: palm-oil red (the droplet and bottle
 * caps), palm-leaf green (the leaves and the "Pure. Natural. Royal." line), and the yellow of
 * the tapioca and garri pouches. Paper and ink neutrals carry everything else.
 */
export type Theme = "light" | "dark";

export const color = {
  paper: "#F8F6F0",
  paper2: "#EFEBE1",
  card: "#FFFFFF",
  ink: "#17140F",
  ink2: "#46413A",
  ink3: "#675F54",
  line: "#DDD6C8",
  lineStrong: "#B5AB97",

  /** Brand red (logo droplet, caps). Primary actions and the palm oil identity. */
  ember: "#B3261E",
  emberDeep: "#861510",
  emberTint: "#F8DEDB",
  onEmber: "#FFFFFF",

  /** Brand green (logo leaves). */
  leaf: "#2E7D4F",
  leafDeep: "#1E5636",
  leafTint: "#DDEEE3",

  /** Information and wholesale-facing UI. */
  sky: "#3F6FB5",
  skyDeep: "#244A82",
  skyTint: "#DCE6F4",

  /** Pouch yellow. Sample-data flags and the tapioca identity. */
  ochre: "#E3B04B",
  ochreDeep: "#7A5200",
  ochreTint: "#F6E6BF",

  success: "#2E6B45",
  successTint: "#D9EBDF",
  warning: "#8A5A00",
  warningTint: "#F7E7C2",
  danger: "#A12525",
  dangerTint: "#F4D6D6",

  rail: "#17140F",
  railLine: "#38332C",
  railText: "#E9E2D3",
} as const;

export const colorDark: Record<keyof typeof color, string> = {
  paper: "#14110D",
  paper2: "#1C1812",
  card: "#1E1A15",
  ink: "#F2EDE2",
  ink2: "#CFC8B8",
  ink3: "#A59D8D",
  line: "#38322A",
  lineStrong: "#5C5445",

  ember: "#EF6A5E",
  emberDeep: "#F59A91",
  emberTint: "#3A1B18",
  onEmber: "#14110D",

  leaf: "#5CB36A",
  leafDeep: "#93D69F",
  leafTint: "#17301D",

  sky: "#6FA0E8",
  skyDeep: "#A9C8F5",
  skyTint: "#1B2A44",

  ochre: "#E3B04B",
  ochreDeep: "#F0CE7E",
  ochreTint: "#3A2E12",

  success: "#6CC287",
  successTint: "#173323",
  warning: "#E0B04A",
  warningTint: "#3A2C0F",
  danger: "#F28B82",
  dangerTint: "#3F1C1A",

  rail: "#0E0C09",
  railLine: "#2A251E",
  railText: "#E9E2D3",
};

/** Series colours per theme. Every series is also told apart by label, legend and a hatch texture. */
export const chartByTheme = {
  light: {
    palm: "#B3261E",
    tapioca: "#B07F10",
    garri: "#2E7D4F",
    retail: "#3F6FB5",
    wholesale: "#B04A8F",
    events: "#7A7468",
    neutral: "#8C8374",
    prior: "#8C8374",
    grid: "#E6E0D3",
    /** Single-hue sequential ramp for normalised choropleths (low to high). */
    sequential: ["#FCEBE9", "#F5C2BC", "#E98D83", "#CF4E42", "#8E1B14"],
    /** Diverging ramp for change (decline to growth) around a neutral midpoint. */
    diverging: ["#3F6FB5", "#9DB8DF", "#E6E3DB", "#9FD0AB", "#2E7D4F"],
  },
  dark: {
    palm: "#D9483D",
    tapioca: "#B88A14",
    garri: "#3A9A66",
    retail: "#4F86D6",
    wholesale: "#B4609E",
    events: "#9A9384",
    neutral: "#8C8374",
    prior: "#8C8374",
    grid: "#2E2922",
    sequential: ["#2A1714", "#5A2520", "#93362E", "#C9524A", "#F08A80"],
    diverging: ["#4F86D6", "#2F4C7A", "#2B2620", "#2F6B45", "#3A9A66"],
  },
} as const;

/**
 * References to the CSS variables, for SVG attributes and inline styles. They resolve in the
 * browser, so a theme switch recolours charts instantly.
 */
export const chart = {
  palm: "var(--chart-palm)",
  tapioca: "var(--chart-tapioca)",
  garri: "var(--chart-garri)",
  retail: "var(--chart-retail)",
  wholesale: "var(--chart-wholesale)",
  events: "var(--chart-events)",
  neutral: "var(--chart-neutral)",
  prior: "var(--chart-prior)",
  grid: "var(--chart-grid)",
  sequential: [1, 2, 3, 4, 5].map((i) => `var(--seq-${i})`),
  diverging: [1, 2, 3, 4, 5].map((i) => `var(--div-${i})`),
} as const;

/** CSS-variable references for neutral and brand colours (use in SVG and inline styles). */
export const v = {
  paper: "var(--color-paper)",
  paper2: "var(--color-paper-2)",
  card: "var(--color-card)",
  ink: "var(--color-ink)",
  ink2: "var(--color-ink-2)",
  ink3: "var(--color-ink-3)",
  line: "var(--color-line)",
  ember: "var(--color-ember)",
  leaf: "var(--color-leaf)",
  sky: "var(--color-sky)",
  ochre: "var(--color-ochre)",
} as const;

/** Concrete values for MapLibre paint properties (WebGL cannot read CSS variables). */
export const mapByTheme = {
  light: {
    background: "#EDE8DE",
    boundary: "#8C8374",
    selectLine: "#17140F",
    outsideFill: "#ECE6DA",
    noData: "#E9E4D8",
    symbol: "#17140F",
    symbolStroke: "#FFFFFF",
    label: "#17140F",
    basemapStyle: "https://tiles.openfreemap.org/styles/positron",
  },
  dark: {
    background: "#1A1610",
    boundary: "#7B725F",
    selectLine: "#F2EDE2",
    outsideFill: "#252019",
    noData: "#2A251E",
    symbol: "#F2EDE2",
    symbolStroke: "#14110D",
    label: "#F2EDE2",
    basemapStyle: "https://tiles.openfreemap.org/styles/dark",
  },
} as const;

export const font = {
  display: "'Fraunces Variable', Georgia, 'Times New Roman', serif",
  body: "'Hanken Grotesk Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

/** 4px base. */
export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const;

export const radius = { none: 0, sm: 2, md: 4, lg: 8 } as const;

export const container = {
  page: 1280,
  reading: 704,
  dashboard: "fluid",
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  ease: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  /** Camera moves on the map: long enough to read, short enough not to block. */
  camera: 650,
} as const;

export const shadow = {
  rule: "0 1px 0 rgba(23, 20, 15, 0.08)",
  raised:
    "0 1px 2px rgba(23, 20, 15, 0.10), 0 4px 12px -6px rgba(23, 20, 15, 0.18)",
  pop: "0 10px 30px -12px rgba(23, 20, 15, 0.35)",
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
