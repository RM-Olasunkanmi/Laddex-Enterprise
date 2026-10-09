import type { CollectionConfig } from "payload";

import { adminOnlyAccess } from "@/lib/collections/base-fields";

/**
 * Real delivery rates owned by operations, one row per geopolitical region.
 * Rates are weight bands in integer kobo. A region with no bands (or no row)
 * falls back to the sample configuration; the estimate API reports which
 * via `isLive`. Replaces REGIONS rates once active.
 */
export const DeliveryZones: CollectionConfig = {
  slug: "delivery-zones",
  admin: { group: "Laddex", useAsTitle: "name" },
  access: adminOnlyAccess,
  fields: [
    {
      name: "regionId",
      type: "select",
      required: true,
      unique: true,
      options: [
        "south-west",
        "south-east",
        "south-south",
        "north-central",
        "north-west",
        "north-east",
      ].map((v) => ({ label: v, value: v })),
    },
    { name: "name", type: "text", required: true },
    {
      name: "bands",
      type: "array",
      required: true,
      minRows: 1,
      admin: { description: "Heaviest band decides the freight-quote threshold." },
      fields: [
        { name: "upToKg", type: "number", required: true, min: 0 },
        { name: "feeKobo", type: "number", required: true, min: 0 },
      ],
    },
    { name: "active", type: "checkbox", defaultValue: true },
  ],
};
