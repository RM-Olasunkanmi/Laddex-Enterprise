import type { CollectionConfig } from "payload";

import { adminOnlyAccess } from "@/lib/collections/base-fields";

export const CheckoutSessions: CollectionConfig = {
  slug: "checkout-sessions",
  admin: {
    group: "Laddex",
    useAsTitle: "reference",
    defaultColumns: ["reference", "email", "status", "grandTotalKobo", "createdAt"],
  },
  access: adminOnlyAccess,
  fields: [
    { name: "reference", type: "text", required: true, unique: true, index: true },
    { name: "idempotencyKey", type: "text", required: true, unique: true, index: true, maxLength: 100 },
    { name: "authorizationUrl", type: "text", maxLength: 500 },
    { name: "cart", type: "relationship", relationTo: "carts", required: true },
    {
      name: "lines",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        { name: "product", type: "relationship", relationTo: "products", required: true },
        { name: "variant", type: "relationship", relationTo: "variants", required: true },
        { name: "title", type: "text", required: true },
        { name: "quantity", type: "number", required: true, min: 1 },
        { name: "unitPriceKobo", type: "number", required: true, min: 0 },
        { name: "lineTotalKobo", type: "number", required: true, min: 0 },
      ],
    },
    { name: "name", type: "text", required: true, maxLength: 120 },
    { name: "phone", type: "text", required: true, maxLength: 32 },
    { name: "email", type: "email", required: true },
    {
      name: "address",
      type: "group",
      fields: [
        { name: "street", type: "text", maxLength: 240 },
        { name: "landmark", type: "text", maxLength: 240 },
        { name: "notes", type: "textarea", maxLength: 1000 },
        { name: "locationLabel", type: "text", maxLength: 240 },
        { name: "state", type: "text", maxLength: 100 },
        { name: "lga", type: "text", maxLength: 100 },
        { name: "lng", type: "number", min: -180, max: 180 },
        { name: "lat", type: "number", min: -90, max: 90 },
      ],
    },
    {
      name: "fulfilment",
      type: "select",
      required: true,
      options: ["delivery", "pickup"],
    },
    { name: "goodsTotalKobo", type: "number", required: true, min: 0 },
    { name: "deliveryTotalKobo", type: "number", required: true, min: 0 },
    { name: "grandTotalKobo", type: "number", required: true, min: 1 },
    {
      name: "feeBasis",
      type: "select",
      required: true,
      options: ["region-rule", "manual-quote", "none"],
    },
    { name: "currency", type: "select", required: true, defaultValue: "NGN", options: ["NGN"] },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "created",
      options: ["created", "initialized", "paid", "order-created", "failed", "expired"],
    },
    { name: "order", type: "relationship", relationTo: "orders" },
    { name: "failureReason", type: "text", maxLength: 500 },
  ],
};
