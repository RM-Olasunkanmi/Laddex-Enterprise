# Product imagery and assets

## Current state

No Laddex photography was supplied. The storefront therefore shows **development renders**: schematic line-and-flat-colour drawings of a bottle, jerrycan, drum, pouch, bag and sack (`src/components/product/pack-visual.tsx`). Every render is labelled "Development render" in the gallery and "not product photo" inside the drawing. They are not inaccurate stock photos and cannot be mistaken for the company's packaging.

## Replacing them with real photographs

1. Put optimised images in `public/products/<product-slug>/` (for example `public/products/palm-oil/25l-front.jpg`). Prefer 1600 px wide JPEG or AVIF.
2. Add entries to the product's `photographs` array in `src/fixtures/products/products.ts` (or return them from the CMS adapter):
   ```ts
   photographs: [{ id: "po-25l-front", kind: "photograph", src: "/products/palm-oil/25l-front.jpg", alt: "25 litre jerrycan of Laddex palm oil, front" }]
   ```
3. `ProductGallery` renders photographs first, through `next/image` with responsive `sizes`, and hides the "Development render" badge for them. Cards and the ladder can switch the same way by reading `photographs` (a one-component change in `ProductCard` and `PackLadder`).
4. Add per-variant photos by extending `ProductImage` with `variantId`; the gallery already receives the selected variant.

## Other assets

- Fonts: self-hosted through `@fontsource-variable/*` (no third-party font requests).
- Icons: inline SVG only.
- Map data: `public/geo/*.json` (see `docs/GEOSPATIAL.md`).
