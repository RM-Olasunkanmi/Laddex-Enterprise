import { randomBytes } from "node:crypto";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { CollectionConfig } from "payload";

import { adminOnlyAccess } from "@/lib/collections/base-fields";
import appConfig from "@/lib/core/config";

const PRIVATE_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../.private",
);

/**
 * Proof-of-payment uploads for bank-transfer orders. Staff-only: they show a
 * customer's bank details, so they are never served from a public media domain.
 * Created only by the transfer endpoint through the Local API.
 */
export const PaymentReceipts: CollectionConfig = {
  slug: "payment-receipts",
  labels: { singular: "Payment receipt", plural: "Payment receipts" },
  admin: { group: "Laddex", useAsTitle: "filename" },
  access: adminOnlyAccess,
  hooks: {
    beforeOperation: [
      ({ req, operation }) => {
        if (operation === "create" && req.file) {
          req.file.name = `${randomBytes(8).toString("hex")}${extname(req.file.name).toLowerCase()}`;
        }
      },
    ],
  },
  fields: [],
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    ...(appConfig.STORAGE_PROVIDER ? {} : { staticDir: join(PRIVATE_DIR, "payment-receipts") }),
  },
};
