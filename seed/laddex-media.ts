/**
 * Laddex media + publish pass. IDEMPOTENT and NON-DESTRUCTIVE: it matches
 * uploads by alt text, reuses anything already present, and never deletes.
 *
 * Usage:  DATABASE_URL=<url> PAYLOAD_SECRET=<secret> pnpm seed:laddex:media
 *
 * Run AFTER `pnpm seed:laddex`, which creates the products and variants as
 * drafts. That seed cannot publish them because publishing requires a gallery
 * row (`gallery` has minRows 1) and a `meta.image`, which need real uploads.
 * This script supplies both from the product photographs in `public/products`,
 * then publishes products and variants so the Payload catalogue adapter can
 * see them (it filters on `_status: published`).
 *
 * Prices and stock still come from the fixtures. They are illustrative and
 * must be reviewed by the business owner before this storefront goes live.
 *
 * Delivery zones are deliberately left inactive: `getDeliveryConfig` falls
 * back to sample rates with a disclaimer until operations enter real ones.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getPayload } from "payload";

import config from "@payload-config";
import { PRODUCTS } from "@/fixtures/products/products";

const PRODUCT_IMAGE_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/products",
);

const MIME_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

type UploadCollection = "gallery-media" | "seo-media";

async function main() {
  const payload = await getPayload({ config });
  const stats = { uploaded: 0, reused: 0, published: 0, variants: 0 };

  /** Upload once per alt text; reuse the existing row on later runs. */
  const upload = async (
    collection: UploadCollection,
    file: string,
    alt: string,
  ): Promise<number | string> => {
    const existing = await payload.find({
      collection,
      limit: 1,
      pagination: false,
      where: { alt: { equals: alt } },
    });
    if (existing.totalDocs > 0) {
      stats.reused += 1;
      return existing.docs[0].id;
    }
    const path = join(PRODUCT_IMAGE_DIR, file);
    const data = await readFile(path);
    const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
    const mimetype = MIME_BY_EXT[ext];
    if (!mimetype) throw new Error(`Unsupported image type: ${file}`);
    const created = await payload.create({
      collection,
      data: { alt },
      file: { data, mimetype, name: file, size: data.byteLength },
    });
    stats.uploaded += 1;
    return created.id;
  };

  for (const product of PRODUCTS) {
    const found = await payload.find({
      collection: "products",
      limit: 1,
      pagination: false,
      where: { slug: { equals: product.slug } },
      draft: true,
    });
    if (found.totalDocs === 0) {
      throw new Error(
        `No product for slug "${product.slug}". Run pnpm seed:laddex first.`,
      );
    }
    const productId = found.docs[0].id;

    const photographs = product.photographs ?? [];
    if (photographs.length === 0) {
      throw new Error(`Product "${product.slug}" has no fixture photographs.`);
    }

    const galleryIds: (number | string)[] = [];
    for (const photo of photographs) {
      galleryIds.push(
        await upload("gallery-media", basename(photo.src), photo.alt),
      );
    }

    // The listing/social card reuses the lead photograph. A distinct alt keeps
    // it from colliding with the gallery row for the same file.
    const lead = photographs[0];
    const seoId = await upload(
      "seo-media",
      basename(lead.src),
      `${lead.alt} (card)`,
    );

    await payload.update({
      collection: "products",
      id: productId,
      data: {
        gallery: galleryIds.map((image) => ({ image })),
        meta: {
          title: product.name,
          description: product.summary,
          image: seoId,
        },
        _status: "published",
      },
    });
    stats.published += 1;

    // Variants carry their own draft state and are filtered the same way.
    const variants = await payload.find({
      collection: "variants",
      depth: 0,
      limit: 200,
      pagination: false,
      where: { product: { equals: productId } },
      draft: true,
    });
    for (const variant of variants.docs) {
      await payload.update({
        collection: "variants",
        id: variant.id,
        data: { _status: "published" },
      });
      stats.variants += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log("Laddex media + publish complete:", stats);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
