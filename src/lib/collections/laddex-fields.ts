import type { Field } from "payload";

/**
 * Laddex catalogue fields. These sit alongside the ecommerce-plugin fields and
 * are the source of truth the Payload catalogue adapter reads:
 * per-litre / per-kilo pack data, integer-kobo prices, wholesale tiers and
 * stock. Tiers are NEVER returned to non-approved accounts —
 * see `src/features/catalogue/adapters/payload.ts`.
 */

export const laddexProductGroup: Field = {
  name: "laddex",
  label: "Laddex catalogue",
  type: "group",
  admin: {
    description:
      "Maps this product to the Laddex storefront catalogue (palm oil by the litre, tapioca and garri by the kilo).",
  },
  fields: [
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Palm oil (sold by the litre)", value: "palm-oil" },
        { label: "Tapioca (sold by the kilo)", value: "tapioca" },
        { label: "Garri (sold by the kilo)", value: "garri" },
      ],
    },
    {
      name: "baseUnit",
      type: "select",
      required: true,
      options: [
        { label: "Litre (l)", value: "l" },
        { label: "Kilogram (kg)", value: "kg" },
      ],
    },
    { name: "summary", type: "textarea" },
    {
      name: "details",
      type: "array",
      labels: { singular: "Paragraph", plural: "Paragraphs" },
      fields: [{ name: "text", type: "textarea", required: true }],
    },
    {
      name: "specs",
      type: "array",
      labels: { singular: "Spec", plural: "Specs" },
      fields: [
        { name: "label", type: "text", required: true },
        { name: "value", type: "text", required: true },
        { name: "note", type: "text" },
      ],
    },
    {
      name: "packagingNotes",
      type: "array",
      fields: [{ name: "text", type: "textarea", required: true }],
    },
    {
      name: "usage",
      type: "array",
      fields: [{ name: "text", type: "text", required: true }],
    },
  ],
};

export const laddexVariantGroup: Field = {
  name: "laddex",
  label: "Laddex pack",
  type: "group",
  admin: {
    description:
      "Pack size, kobo pricing, wholesale tiers and stock for the Laddex storefront.",
  },
  fields: [
    {
      name: "sku",
      type: "text",
      required: true,
      admin: { description: 'Pack code, e.g. "PO-25L". Used as the storefront variant id.' },
    },
    {
      name: "sizeAmount",
      type: "number",
      required: true,
      min: 0,
      admin: { description: "Pack size number, e.g. 25 for a 25 L jerrycan." },
    },
    {
      name: "sizeUnit",
      type: "select",
      required: true,
      options: ["ml", "l", "g", "kg"].map((u) => ({ label: u, value: u })),
    },
    {
      name: "contentBase",
      type: "number",
      required: true,
      min: 0,
      admin: {
        description: "Contents in the product base unit (litres or kg) for per-unit pricing.",
      },
    },
    {
      name: "packaging",
      type: "select",
      required: true,
      options: ["bottle", "pouch", "bag", "sack"].map((p) => ({
        label: p,
        value: p,
      })),
    },
    {
      name: "format",
      type: "select",
      required: true,
      defaultValue: "packaged",
      options: [
        { label: "Packaged", value: "packaged" },
        { label: "Bulk", value: "bulk" },
      ],
    },
    {
      name: "retailPriceKobo",
      type: "number",
      required: true,
      min: 0,
      admin: { description: "List price for one pack in kobo (integer, never floats)." },
    },
    {
      name: "wholesaleTiers",
      type: "array",
      labels: { singular: "Price tier", plural: "Price tiers" },
      admin: {
        description:
          "Volume breaks. Returned ONLY to approved wholesale accounts.",
      },
      fields: [
        { name: "minQty", type: "number", required: true, min: 2 },
        { name: "unitPriceKobo", type: "number", required: true, min: 0 },
      ],
    },
    {
      name: "wholesaleMinQty",
      type: "number",
      required: true,
      defaultValue: 10,
      min: 1,
    },
    {
      name: "stockQty",
      type: "number",
      required: true,
      defaultValue: 0,
      min: 0,
      admin: { description: "Packs available at the Epe store." },
    },
    {
      name: "lowStockThreshold",
      type: "number",
      defaultValue: 5,
      min: 0,
      admin: { description: "At or below this, the storefront shows low stock." },
    },
    {
      name: "shippingWeightKg",
      type: "number",
      required: true,
      min: 0,
      admin: { description: "Filled pack weight in kg (contents plus packaging)." },
    },
  ],
};
