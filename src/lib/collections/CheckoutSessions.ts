import type { CollectionAfterChangeHook, CollectionConfig } from "payload";

import { adminOnlyAccess } from "@/lib/collections/base-fields";

/**
 * Staff mark a bank-transfer session `paid` after matching the money in the account.
 * That creates the real order (and takes stock) through the same trusted path the
 * Paystack webhook uses, in the same transaction: if stock ran out, the whole save
 * fails and the session stays awaiting verification.
 */
const createOrderWhenTransferConfirmed: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (
    operation !== "update" ||
    doc.status !== "paid" ||
    previousDoc?.status === "paid" ||
    doc.payment?.method !== "bank-transfer"
  ) {
    return doc;
  }
  if (doc.feeBasis === "manual-quote") {
    throw new Error("A manual delivery quote cannot be confirmed as paid.");
  }
  if (Number(doc.payment?.amountPaidKobo) < Number(doc.grandTotalKobo)) {
    throw new Error(
      "The customer reported paying less than the order total. Correct the reported amount after checking the statement, or reject the transfer.",
    );
  }

  req.context ??= {};
  req.context.trustedOrderSource = "bank-transfer-confirmed";
  const cart = typeof doc.cart === "object" ? doc.cart.id : doc.cart;
  const order = await req.payload.create({
    collection: "orders",
    data: {
      checkoutSession: doc.id,
      cart,
      name: doc.name,
      phone: doc.phone,
      email: doc.email,
      items: [],
      paymentIntentId: doc.reference,
    },
    req,
  });
  await req.payload.update({
    collection: "checkout-sessions",
    id: doc.id,
    data: { status: "order-created", order: order.id },
    req,
  });
  return doc;
};

export const CheckoutSessions: CollectionConfig = {
  slug: "checkout-sessions",
  admin: {
    group: "Laddex",
    useAsTitle: "reference",
    defaultColumns: ["reference", "email", "status", "grandTotalKobo", "createdAt"],
  },
  access: adminOnlyAccess,
  hooks: { afterChange: [createOrderWhenTransferConfirmed] },
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
      options: [
        "created",
        "initialized",
        "awaiting-verification",
        "paid",
        "order-created",
        "rejected",
        "failed",
        "expired",
      ],
      admin: {
        description:
          "Bank transfers: check the money has arrived in the account, then set to Paid to create the order. Set to Rejected if it has not.",
      },
    },
    {
      name: "payment",
      type: "group",
      admin: { description: "Bank-transfer proof submitted by the customer." },
      fields: [
        {
          name: "method",
          type: "select",
          options: ["paystack", "bank-transfer"],
        },
        { name: "payerName", type: "text", maxLength: 120, admin: { description: "Name on the sending account." } },
        { name: "payerBank", type: "text", maxLength: 120 },
        {
          name: "amountPaidKobo",
          type: "number",
          min: 0,
          admin: { description: "As reported by the customer, in kobo (100 kobo = ₦1). Verify against the statement." },
        },
        { name: "paidAt", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
        { name: "transferReference", type: "text", maxLength: 120 },
        { name: "receipt", type: "relationship", relationTo: "payment-receipts" },
        { name: "staffNote", type: "textarea", maxLength: 1000, admin: { description: "Internal. Reason for rejecting, or what you matched." } },
      ],
    },
    { name: "order", type: "relationship", relationTo: "orders" },
    { name: "failureReason", type: "text", maxLength: 500 },
  ],
};
