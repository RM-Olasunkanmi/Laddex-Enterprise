import type { CollectionConfig } from "payload";

import { adminOnlyAccess, isAdmin } from "@/lib/collections/base-fields";

/**
 * Volume quote requests from the quote builder. The indicative total the
 * builder shows is not an offer; staff reply in writing via staffResponse.
 */
export const QuoteRequests: CollectionConfig = {
  slug: "quote-requests",
  admin: { group: "Laddex", useAsTitle: "contactName" },
  access: {
    ...adminOnlyAccess,
    create: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (data && operation === "create" && !isAdmin({ req })) {
          data.status = "new";
          data.staffPriceKobo = null;
          data.staffResponse = null;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "lines",
      type: "array",
      required: true,
      minRows: 1,
      maxRows: 50,
      fields: [
        { name: "variantSku", type: "text", required: true, maxLength: 100 },
        { name: "qty", type: "number", required: true, min: 1, max: 9999 },
      ],
    },
    { name: "contactName", type: "text", required: true, maxLength: 120 },
    { name: "phone", type: "text", required: true, maxLength: 32 },
    { name: "email", type: "email", required: true },
    { name: "businessName", type: "text", maxLength: 160 },
    { name: "note", type: "textarea", maxLength: 2000 },
    {
      name: "status",
      type: "select",
      defaultValue: "new",
      options: ["new", "priced", "responded", "closed"].map((v) => ({
        label: v,
        value: v,
      })),
      access: { create: isAdmin, update: isAdmin },
    },
    {
      name: "staffPriceKobo",
      type: "number",
      min: 0,
      admin: { description: "Staff's quoted total in kobo." },
      access: { create: isAdmin, update: isAdmin },
    },
    {
      name: "staffResponse",
      type: "textarea",
      maxLength: 2000,
      access: { create: isAdmin, update: isAdmin },
    },
  ],
};
