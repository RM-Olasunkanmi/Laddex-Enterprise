import type { CollectionConfig } from "payload";

import { adminOnlyAccess, isAdmin } from "@/lib/collections/base-fields";

/**
 * Wholesale applications from businesses. Anyone may apply; only staff may
 * read or decide. Approval sets the linked user's wholesaleStatus (done by
 * staff in /admin), which unlocks tier pricing in the catalogue adapter.
 * Review time is deliberately not promised in the UI.
 */
export const WholesaleApplications: CollectionConfig = {
  slug: "wholesale-applications",
  admin: { group: "Laddex", useAsTitle: "businessName" },
  access: {
    ...adminOnlyAccess,
    create: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (data && operation === "create" && !isAdmin({ req })) {
          data.status = "pending";
          data.reviewerNote = null;
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "businessName", type: "text", required: true, maxLength: 160 },
    {
      name: "businessType",
      type: "select",
      required: true,
      options: ["retailer", "caterer", "restaurant", "distributor", "processor", "other"].map(
        (v) => ({ label: v, value: v }),
      ),
    },
    { name: "contactName", type: "text", required: true, maxLength: 120 },
    { name: "phone", type: "text", required: true, maxLength: 32 },
    { name: "email", type: "email", required: true },
    { name: "state", type: "text", maxLength: 100 },
    { name: "message", type: "textarea", maxLength: 2000 },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      options: ["pending", "approved", "rejected"].map((v) => ({
        label: v,
        value: v,
      })),
      access: { create: isAdmin, update: isAdmin },
    },
    {
      name: "reviewerNote",
      type: "textarea",
      maxLength: 2000,
      access: { create: isAdmin, update: isAdmin },
    },
  ],
};
