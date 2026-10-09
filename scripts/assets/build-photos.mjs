// Builds the web assets from the sample images supplied by Laddex (assets-src/).
// Run: node scripts/assets/build-photos.mjs
// The sources are low-resolution screenshots (a logo of 235 px and frames from a social-media post).
// Replace the files in assets-src/ with originals and re-run; see docs/ASSETS.md.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const src = (f) => new URL(`../../assets-src/${f}`, import.meta.url).pathname;
const out = (f) => new URL(`../../public/${f}`, import.meta.url).pathname;
mkdirSync(out("brand"), { recursive: true });
mkdirSync(out("products"), { recursive: true });

// Logo: the supplied PNG has an opaque black surround. Find the white disc and mask to a circle.
{
  const { data, info } = await sharp(src("logo-original.png")).raw().toBuffer({ resolveWithObject: true });
  let minx = 1e9, maxx = -1, miny = 1e9, maxy = -1;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if ((data[i] + data[i + 1] + data[i + 2]) / 3 > 200) {
        minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
      }
    }
  const d = Math.min(maxx - minx, maxy - miny) - 2;
  const left = Math.round((minx + maxx) / 2 - d / 2);
  const top = Math.round((miny + maxy) / 2 - d / 2);
  const mask = Buffer.from(`<svg width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2 - 1}" fill="#fff"/></svg>`);
  const square = await sharp(src("logo-original.png")).extract({ left, top, width: d, height: d }).ensureAlpha().png().toBuffer();
  const masked = await sharp(square).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  await sharp(masked).toFile(out("brand/laddex-logo.png"));
  await sharp(masked).resize(64, 64).png().toFile(out("brand/laddex-logo-64.png"));
}

// Crops avoid the black bar at the right edge of the shelf frame and the person at its left edge.
const crops = [
  // [source, output, {left, top, width, height}]
  ["palm-oil-sample.webp", "products/palm-oil-lineup.webp", { left: 14, top: 96, width: 500, height: 330 }],
  ["palm-oil-sample.webp", "products/palm-oil-full.webp", { left: 0, top: 22, width: 540, height: 717 }],
  ["shelf-sample.webp", "products/garri-igbo.webp", { left: 372, top: 0, width: 166, height: 235 }],
  ["shelf-sample.webp", "products/garri-ijebu.webp", { left: 258, top: 20, width: 160, height: 240 }],
  ["shelf-sample.webp", "products/tapioca-flakes.webp", { left: 285, top: 318, width: 250, height: 330 }],
  ["shelf-sample.webp", "products/garri-shelf.webp", { left: 270, top: 0, width: 268, height: 250 }],
];
for (const [file, dest, region] of crops) {
  await sharp(src(file)).extract(region).webp({ quality: 88 }).toFile(out(dest));
  console.log("wrote", dest, `${region.width}x${region.height}`);
}
console.log("wrote brand/laddex-logo.png");
