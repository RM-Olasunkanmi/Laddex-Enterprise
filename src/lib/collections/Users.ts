import type { CollectionConfig } from "payload";

import { isAdmin } from "@/lib/collections/base-fields";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    group: "Other",
    defaultColumns: ["email"],
  },
  auth: true,
  access: {
    read: ({ req }) =>
      isAdmin({ req })
        ? true
        : req.user
          ? { id: { equals: req.user.id } }
          : false,
    create: () => false,
    delete: () => false,
    update: isAdmin,
    admin: isAdmin,
  },
  fields: [
    {
      name: "roles",
      type: "select",
      hasMany: true,
      defaultValue: ["admin"],
      options: [
        { label: "admin", value: "admin" },
        { label: "analyst", value: "analyst" },
        { label: "customer", value: "customer" },
      ],
      admin: {
        hidden: true,
      },
    },
    { name: "phone", type: "text" },
    { name: "businessName", type: "text" },
    {
      name: "wholesaleStatus",
      type: "select",
      defaultValue: "none",
      options: [
        { label: "None (retail)", value: "none" },
        { label: "Pending approval", value: "pending" },
        { label: "Approved", value: "approved" },
      ],
      admin: {
        description:
          "Approved unlocks wholesale tier pricing in the catalogue adapter. Set by staff after reviewing a wholesale application.",
      },
    },
  ],
};
