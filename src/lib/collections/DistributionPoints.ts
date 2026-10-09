import type { CollectionConfig } from "payload";

import { isAdmin } from "@/lib/collections/base-fields";

/**
 * Operations-managed distribution points. Only records explicitly verified by
 * staff may be presented as exact pickup or dispatch locations.
 * `verified` points appear on shopper maps and feed the contact page;
 * unverified rows stay hidden until operations confirms them.
 */
export const DistributionPoints: CollectionConfig = {
  slug: "distribution-points",
  admin: { group: "Laddex", useAsTitle: "name" },
  access: {
    read: ({ req }) =>
      isAdmin({ req })
        ? true
        : {
            active: { equals: true },
            verified: { equals: true },
          },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "address", type: "text" },
    { name: "lng", type: "number", required: true },
    { name: "lat", type: "number", required: true },
    { name: "openingHours", type: "text" },
    { name: "phone", type: "text" },
    {
      name: "verified",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Only verified points appear on shopper maps.",
      },
    },
    { name: "active", type: "checkbox", defaultValue: true },
  ],
};
