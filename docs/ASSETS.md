# Product imagery and assets

## Current state

Real photographs and the real logo supplied by the owner are used:

| File                                                                                             | Source                                                     | Used for                            |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------- |
| `public/brand/laddex-logo.png`, `laddex-logo-64.png`                                             | Circular LADDEX logo, black surround masked to transparent | Header, footer, staff rail, favicon |
| `public/products/palm-oil-lineup.webp`, `palm-oil-full.webp`                                     | Palm oil bottle photo                                      | Palm oil card and gallery           |
| `public/products/garri-igbo.webp`, `garri-ijebu.webp`, `tapioca-flakes.webp`, `garri-shelf.webp` | Frames cropped from the shelf video                        | Garri, tapioca and category tiles   |

These are **low-resolution frames** (the largest is about 540 px wide), so they look soft on large screens. Each is labelled "Sample photo supplied by Laddex". Source files are in `assets-src/`; `node scripts/assets/build-photos.mjs` regenerates the web files (crops avoid the person in the frame, the black video bar and the social-media overlay text).

## Replacing them

1. Put original photographs (1600 px wide or more) in `public/products/`.
2. Point the `photo(...)` entries in `src/fixtures/products/products.ts` at them, and drop the sample note.
3. `ProductPhoto` and `ProductGallery` render through `next/image`.

## Needed from the owner

- Original photos of each product, ideally one per size (the 1 kg, 5 kg, 25 kg and 50 kg bags look different).
- The real pack sizes and prices. The sizes and prices in the fixtures are illustrative.
- Phone, WhatsApp, email and address for `src/content/business.ts`.

## Other assets

- Fonts self-hosted via `@fontsource-variable/*`. Icons are inline SVG.
- Map data: `public/geo` (see `docs/GEOSPATIAL.md`).
