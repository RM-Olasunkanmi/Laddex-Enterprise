import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { chartByTheme, color, colorDark, contrast } from "./tokens";

const css = readFileSync("src/styles/laddex.css", "utf8");
const light = css.slice(0, css.indexOf(':root[data-theme="dark"]'));
const dark = css.slice(css.indexOf(':root[data-theme="dark"]'));
const cssVar = (block: string, name: string) =>
  new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(block)?.[1]?.toLowerCase();
const kebab = (s: string) =>
  s.replace(/[A-Z0-9]/g, (m) => `-${m.toLowerCase()}`);

describe("design tokens stay in sync with the stylesheet", () => {
  it.each([
    ["light", color, light],
    ["dark", colorDark, dark],
  ] as const)("%s colour variables match tokens.ts", (_n, tokens, block) => {
    for (const [key, hex] of Object.entries(tokens)) {
      expect(
        cssVar(block, `color-${kebab(key)}`),
        `--color-${kebab(key)}`,
      ).toBe(hex.toLowerCase());
    }
  });
  it.each([
    ["light", chartByTheme.light, light],
    ["dark", chartByTheme.dark, dark],
  ] as const)("%s chart variables match tokens.ts", (_n, c, block) => {
    for (const k of [
      "palm",
      "tapioca",
      "garri",
      "retail",
      "wholesale",
      "events",
      "neutral",
      "prior",
      "grid",
    ] as const) {
      expect(cssVar(block, `chart-${k}`), k).toBe(c[k].toLowerCase());
    }
    c.sequential.forEach((hex, i) =>
      expect(cssVar(block, `seq-${i + 1}`)).toBe(hex.toLowerCase()),
    );
    c.diverging.forEach((hex, i) =>
      expect(cssVar(block, `div-${i + 1}`)).toBe(hex.toLowerCase()),
    );
  });
});

describe.each([
  ["light", color],
  ["dark", colorDark],
] as const)("text and control contrast, %s theme", (_theme, c) => {
  it.each([
    ["ink on paper", c.ink, c.paper, 7],
    ["ink-2 on paper", c.ink2, c.paper, 7],
    ["ink-3 on paper", c.ink3, c.paper, 4.5],
    ["ink-3 on card", c.ink3, c.card, 4.5],
    ["ink-3 on paper-2", c.ink3, c.paper2, 4.5],
    ["ink on card", c.ink, c.card, 7],
    ["on-ember on ember (primary button)", c.onEmber, c.ember, 4.5],
    ["ember on paper (links, eyebrows)", c.ember, c.paper, 4.5],
    ["ember on card", c.ember, c.card, 4.5],
    ["leaf on paper", c.leaf, c.paper, 4.5],
    ["sky on paper", c.sky, c.paper, 4.5],
    ["success on tint", c.success, c.successTint, 4.5],
    ["warning on tint", c.warning, c.warningTint, 4.5],
    ["danger on tint", c.danger, c.dangerTint, 4.5],
    ["ochre-deep on ochre-tint", c.ochreDeep, c.ochreTint, 4.5],
    ["sky-deep on sky-tint", c.skyDeep, c.skyTint, 4.5],
    ["leaf-deep on leaf-tint", c.leafDeep, c.leafTint, 4.5],
    ["ink on ember-tint", c.ink, c.emberTint, 7],
    ["rail text on rail", c.railText, c.rail, 7],
  ])("%s", (_n, fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});

describe("chart series colours stand clear of their surface", () => {
  it.each([
    ["light", chartByTheme.light, color.card],
    ["dark", chartByTheme.dark, colorDark.card],
  ] as const)(
    "%s: every series reaches 3:1 against the card",
    (_t, c, surface) => {
      for (const k of [
        "palm",
        "tapioca",
        "garri",
        "retail",
        "wholesale",
      ] as const) {
        expect(contrast(c[k], surface), k).toBeGreaterThanOrEqual(3);
      }
    },
  );
});
