import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { color, contrast } from "./tokens";

const css = readFileSync("src/styles/laddex.css", "utf8");
const cssVar = (name: string) =>
  new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1]?.toLowerCase();

const kebab = (s: string) => s.replace(/[A-Z0-9]/g, (m) => `-${m.toLowerCase()}`);

describe("design tokens", () => {
  it("keeps CSS custom properties in sync with tokens.ts", () => {
    const pairs: [string, string][] = [
      ["paper", color.paper], ["paper-2", color.paper2], ["card", color.card], ["ink", color.ink],
      ["ink-2", color.ink2], ["ink-3", color.ink3], ["line", color.line], ["line-strong", color.lineStrong],
      ["ember", color.ember], ["ember-deep", color.emberDeep], ["ember-tint", color.emberTint],
      ["slate", color.slate], ["slate-deep", color.slateDeep], ["slate-tint", color.slateTint],
      ["ochre", color.ochre], ["ochre-deep", color.ochreDeep], ["ochre-tint", color.ochreTint],
      ["success", color.success], ["warning", color.warning], ["danger", color.danger],
      ["rail", color.rail], ["rail-text", color.railText],
    ];
    for (const [name, hex] of pairs) {
      expect(cssVar(name), `--color-${name} (${kebab(name)})`).toBe(hex.toLowerCase());
    }
  });

  it.each([
    ["ink on paper", color.ink, color.paper, 7],
    ["ink-2 on paper", color.ink2, color.paper, 7],
    ["ink-3 on paper", color.ink3, color.paper, 4.5],
    ["ink-3 on card", color.ink3, color.card, 4.5],
    ["on-ember on ember", color.onEmber, color.ember, 4.5],
    ["ember on paper", color.ember, color.paper, 4.5],
    ["slate on paper", color.slate, color.paper, 4.5],
    ["paper on ink", color.paper, color.ink, 7],
    ["rail text on rail", color.railText, color.rail, 7],
    ["success on tint", color.success, color.successTint, 4.5],
    ["warning on tint", color.warning, color.warningTint, 4.5],
    ["danger on tint", color.danger, color.dangerTint, 4.5],
    ["ochre-deep on ochre-tint", color.ochreDeep, color.ochreTint, 4.5],
    ["slate-deep on slate-tint", color.slateDeep, color.slateTint, 4.5],
    ["ink on ochre", color.ink, color.ochre, 7],
  ])("meets contrast: %s", (_n, fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
