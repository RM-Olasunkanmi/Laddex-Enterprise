import { describe, expect, it, vi } from "vitest";

// The adapter imports the Payload config for its loader; these tests only exercise the mapping.
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn() }));

import { toProduct } from "./payload";

const image = (id: number, alt: string, file: string) => ({
  image: { id, alt, url: `/api/gallery-media/file/${file}`, width: 500, height: 330 },
});
const doc = (gallery: unknown[]) => ({
  id: 1,
  slug: "palm-oil",
  title: "Palm Oil",
  laddex: { category: "palm-oil", baseUnit: "l" },
  gallery,
});

describe("payload catalogue photographs", () => {
  it("serves the bundled originals when the gallery holds the seeded copies", () => {
    // The records on the live site: uploaded by the media seed to a local disk Vercel cannot read.
    const p = toProduct(
      doc([
        image(1, "Five Laddex palm oil bottles of different sizes with red caps, standing together", "d5e9d2508e12-500x330.webp"),
        image(2, "Laddex palm oil bottles on a woven mat beside a glass bowl of palm oil", "80c068b62031-540x717.webp"),
      ]),
      [],
    )!;
    expect(p.photographs.length).toBeGreaterThan(0);
    for (const ph of p.photographs) expect(ph.src).toMatch(/^\/products\//);
  });

  it("keeps photos staff uploaded with their own alt text", () => {
    const p = toProduct(doc([image(9, "New 5 L bottle on a kitchen counter", "abc-800x800.webp")]), [])!;
    expect(p.photographs[0].src).toBe("/api/gallery-media/file/abc-800x800.webp");
  });

  it("falls back to bundled photos when a product has no gallery", () => {
    const p = toProduct(doc([]), [])!;
    expect(p.photographs[0]?.src).toMatch(/^\/products\//);
  });
});
