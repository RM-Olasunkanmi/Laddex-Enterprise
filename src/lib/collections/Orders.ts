import { addDataAndFileToRequest } from "payload";

import type { Variant } from "@/lib/core/types/payload-types";
import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";
import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
} from "payload";

import {
  adminOnlyAccess,
  isAdmin,
  stripAdminFieldComponent,
} from "@/lib/collections/base-fields";
import { revalidate } from "@/lib/collections/hooks";
import appConfig from "@/lib/core/config";
import { getOrderDashboard } from "@/lib/core/dal/order-dashboard";
import { OrderNotifier } from "@/lib/core/OrderNotifier";
import {
  type CartItem,
  type OrderItem,
  CollectionName,
  OrderStatus,
} from "@/lib/core/types/types";
import { isValidOrderStatusTransition } from "@/lib/core/util";
import { stripePaymentIntentField } from "@/lib/stripe/server";

const trustedPaystackOrder = (req: { context?: Record<string, unknown> }) =>
  req.context?.trustedOrderSource === "paystack-webhook";

export const Orders: CollectionOverride = ({ defaultCollection }) => {
  return {
    ...defaultCollection,

    admin: {
      ...(defaultCollection.admin || {}),
      useAsTitle: "name",
      defaultColumns: ["name", "phone", "email", "createdAt"],
    },

    access: {
      ...adminOnlyAccess,
      create: ({ req }) => isAdmin({ req }) || trustedPaystackOrder(req),
    },

    fields: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...((defaultCollection.fields || []) as any[])
        .filter(
          (f) =>
            f?.type !== "tabs" &&
            (!f?.name || !["customerEmail", "transactions"].includes(f.name)),
        )
        .map((f) => {
          if (f?.name === "customer")
            return {
              ...f,
              required: false,
              admin: {
                ...(f.admin || {}),
                position: "sidebar",
                hidden: true,
                condition: () => false,
                readOnly: true,
                disabled: true,
              },
            };

          if (f?.name === "status")
            return {
              ...f,
              defaultValue: OrderStatus.NEW,
              options: Object.values(OrderStatus),
              admin: {
                ...(f.admin || {}),
                position: "sidebar",
                hidden: true,
                readOnly: true,
                disabled: true,
              },
            };

          if (f.type !== "row" || !Array.isArray(f.fields)) return f;

          const amountField = f.fields[0];
          const fixedAmount = {
            ...amountField,
            admin: stripAdminFieldComponent(amountField.admin),
          };

          return { ...f, fields: [fixedAmount] };
        }),

      { name: "name", type: "text", required: true },
      { name: "phone", type: "text", required: true },
      { name: "email", type: "email", required: true },
      {
        name: "cart",
        type: "relationship",
        relationTo: "carts",
        admin: { position: "sidebar", readOnly: true },
      },
      {
        name: "checkoutSession",
        type: "relationship",
        relationTo: "checkout-sessions",
        unique: true,
        admin: { position: "sidebar", readOnly: true },
      },
      stripePaymentIntentField,
      {
        name: "laddex",
        label: "Laddex fulfilment",
        type: "group",
        fields: [
          { name: "lng", type: "number", admin: { description: "Exact delivery longitude. Personal data." } },
          { name: "lat", type: "number", admin: { description: "Exact delivery latitude. Personal data." } },
          { name: "street", type: "text", maxLength: 240 },
          { name: "landmark", type: "text", maxLength: 240 },
          { name: "notes", type: "textarea", maxLength: 1000 },
          { name: "locationLabel", type: "text", maxLength: 240 },
          { name: "state", type: "text", maxLength: 100 },
          { name: "lga", type: "text", maxLength: 100 },
          {
            name: "fulfilment",
            type: "select",
            defaultValue: "delivery",
            options: [
              { label: "Delivery", value: "delivery" },
              { label: "Pickup at Epe store", value: "pickup" },
            ],
          },
          {
            name: "channel",
            type: "select",
            defaultValue: "online",
            options: [
              { label: "Online store", value: "online" },
              { label: "Phone", value: "phone" },
              { label: "Sales desk", value: "sales-desk" },
            ],
          },
          {
            name: "feeBasis",
            type: "select",
            defaultValue: "none",
            options: [
              { label: "Region rule", value: "region-rule" },
              { label: "Manual quote", value: "manual-quote" },
              { label: "None", value: "none" },
            ],
          },
          { name: "feeKobo", type: "number", min: 0, defaultValue: 0 },
        ],
      },
      {
        name: "OrderView",
        type: "ui",
        admin: {
          position: "sidebar",
          components: {
            Field: "@/components/admin/order-view#OrderView",
          },
        },
      },

      {
        name: "items",
        type: "array",
        required: true,
        fields: [
          {
            name: "product",
            type: "relationship",
            relationTo: CollectionName.products,
            required: true,
          },
          {
            name: "variant",
            type: "relationship",
            relationTo: "variants",
          },

          { name: "title", type: "text", required: true },
          { name: "quantity", type: "number", required: true },
          { name: "unitPrice", type: "number", required: true },
          { name: "lineTotal", type: "number", required: true },
        ],
      },
    ],

    endpoints: [
      ...(defaultCollection.endpoints || []),
      {
        path: "/dashboard",
        method: "get",
        handler: getOrderDashboard,
      },
      {
        path: "/:id/status",
        method: "post",
        handler: async (req) => {
          if (!isAdmin({ req })) {
            return Response.json({ message: "Forbidden" }, { status: 403 });
          }

          await addDataAndFileToRequest(req);
          const id = req.routeParams?.id;
          const nextStatus = req.data?.status;
          if (!id || typeof nextStatus !== "string") {
            return Response.json(
              { message: "status is required" },
              { status: 400 },
            );
          }

          const order = await req.payload.findByID({
            collection: "orders",
            id: String(id),
          });

          if (
            !isValidOrderStatusTransition(
              order.status as unknown as OrderStatus,
              nextStatus,
            )
          ) {
            return Response.json(
              { message: "Invalid status transition" },
              { status: 400 },
            );
          }

          const updated = await req.payload.update({
            collection: "orders",
            id: String(id),
            data: { status: nextStatus },
            req,
          });

          return Response.json(updated);
        },
      },
    ],

    hooks: {
      ...(defaultCollection.hooks || {}),

      beforeChange: [
        ...((defaultCollection.hooks?.beforeChange || []) as CollectionBeforeChangeHook[]),
        async ({ data, operation, req }) => {
          if (operation !== "create" || !Array.isArray(data.items)) return data;

          // The order create and these conditional reservations share Payload's
          // request transaction, so a later failure rolls all inventory back.
          for (const item of data.items) {
            const variantId =
              typeof item?.variant === "object" ? item.variant?.id : item?.variant;
            const quantity = Number(item?.quantity);
            if (!variantId || !Number.isSafeInteger(quantity) || quantity < 1) {
              throw new Error("Every order line requires a variant and whole-number quantity.");
            }
            const updated = await req.payload.db.updateOne({
              collection: "variants",
              where: {
                and: [
                  { id: { equals: variantId } },
                  { inventory: { greater_than_equal: quantity } },
                ],
              },
              data: { inventory: { $inc: -quantity } },
              req,
            });
            if (!updated || Number(updated.inventory) < 0) {
              throw new Error("Insufficient inventory for this order.");
            }
          }
          return data;
        },
      ],

      afterChange: [
        ...((defaultCollection.hooks?.afterChange ||
          []) as CollectionAfterChangeHook[]),

        async (args) => {
          const { operation, doc, req } = args;
          if (operation !== "create") return doc;

          const items: OrderItem[] = Array.isArray(doc.items) ? doc.items : [];
          const touchedProductIds = new Set(
            items
              .map((item) =>
                typeof item.product === "object" ? item.product?.id : item.product,
              )
              .filter((id): id is number => typeof id === "number"),
          );

          if (touchedProductIds.size) {
            const products = await req.payload.find({
              collection: CollectionName.products,
              depth: 0,
              pagination: false,
              limit: touchedProductIds.size,
              where: { id: { in: Array.from(touchedProductIds) } },
              select: { slug: true },
            });

            for (const product of products.docs) {
              if (product.slug) {
                revalidate(`${CollectionName.products}-${product.slug}`);
              }
            }
          }

          return doc;
        },

        async (args) => {
          const { operation, doc, req } = args;
          if (
            operation !== "create" ||
            req.context?.skipOrderNotification ||
            !appConfig.SEND_EMAIL_WHATSAPP
          )
            return doc;

          await new OrderNotifier(req.payload).send(doc);

          return doc;
        },
      ],
      beforeValidate: [
        ...((defaultCollection.hooks
          ?.beforeValidate as CollectionBeforeValidateHook[]) || []),
        async ({ data, req, operation }) => {
          if (!data) return data;

          let paidLineSnapshot:
            | {
                product: number;
                variant: number;
                title: string;
                quantity: number;
                unitPrice: number;
                lineTotal: number;
              }[]
            | undefined;

          if (operation === "create") {
            if (!isAdmin({ req }) && !trustedPaystackOrder(req)) {
              throw new Error(
                "Orders may only be created by staff or a verified payment webhook.",
              );
            }
            data.status = OrderStatus.NEW;
          }

          if (operation === "create" && trustedPaystackOrder(req)) {
            const rawSession = data.checkoutSession;
            const sessionId =
              typeof rawSession === "object" ? rawSession?.id : rawSession;
            if (!sessionId) throw new Error("A checkout session is required.");
            const session = await req.payload.findByID({
              collection: "checkout-sessions",
              id: sessionId,
              depth: 0,
              overrideAccess: true,
            });
            if (
              session.status !== "paid" ||
              session.feeBasis === "manual-quote" ||
              session.reference !== data.paymentIntentId
            ) {
              throw new Error(
                "Checkout session is not authorized for order creation.",
              );
            }
            data.cart =
              typeof session.cart === "object"
                ? session.cart?.id
                : session.cart;
            data.name = session.name;
            data.phone = session.phone;
            data.email = session.email;
            data.amount = session.grandTotalKobo;
            paidLineSnapshot = (session.lines ?? []).map((line) => ({
              product:
                typeof line.product === "object" ? line.product.id : line.product,
              variant:
                typeof line.variant === "object" ? line.variant.id : line.variant,
              title: line.title,
              quantity: line.quantity,
              unitPrice: line.unitPriceKobo,
              lineTotal: line.lineTotalKobo,
            }));
            if (
              paidLineSnapshot.length === 0 ||
              paidLineSnapshot.reduce((sum, line) => sum + line.lineTotal, 0) !==
                session.goodsTotalKobo
            ) {
              throw new Error("Checkout session line snapshot is invalid.");
            }
            data.laddex = {
              lng: session.address?.lng,
              lat: session.address?.lat,
              street: session.address?.street,
              landmark: session.address?.landmark,
              notes: session.address?.notes,
              locationLabel: session.address?.locationLabel,
              state: session.address?.state,
              lga: session.address?.lga,
              fulfilment: session.fulfilment,
              channel: "online",
              feeBasis: session.feeBasis,
              feeKobo: session.deliveryTotalKobo,
            };
          }

          const rawCart = data.cart;
          const cartId = typeof rawCart === "object" ? rawCart?.id : rawCart;
          if (!cartId) {
            if (operation === "create") {
              throw new Error("An order must be created from a cart.");
            }
            return data;
          }

          const cart = await req.payload.findByID({
            collection: "carts",
            id: cartId,
            depth: 3,
            overrideAccess: true,
          });

          const items: CartItem[] = paidLineSnapshot
            ? paidLineSnapshot.map((line) => ({
                product: line.product,
                variant: line.variant,
                quantity: line.quantity,
              }))
            : Array.isArray(cart?.items)
              ? cart.items
              : [];
          if (operation === "create" && items.length === 0) {
            throw new Error("An order cannot be created from an empty cart.");
          }

          if (operation === "create") {
            for (const item of items) {
              const productId =
                typeof item.product === "object"
                  ? item.product?.id
                  : item.product;
              const variantId =
                typeof item.variant === "object"
                  ? item.variant?.id
                  : item.variant;

              const quantity = Number(item.quantity);
              if (!variantId || !Number.isSafeInteger(quantity) || quantity < 1) {
                throw new Error(
                  "Cart lines require a variant and whole-number quantity.",
                );
              }

              const variant =
                typeof item.variant === "object" && item.variant
                  ? item.variant
                  : await req.payload.findByID({
                      collection: "variants",
                      id: variantId,
                      depth: 0,
                      select: { product: true, inventory: true, laddex: true },
                    });
              const variantProductId =
                typeof variant.product === "object"
                  ? variant.product?.id
                  : variant.product;

              if (
                !productId ||
                String(variantProductId) !== String(productId)
              ) {
                throw new Error("Cart variant does not belong to its product.");
              }
              if (Number(variant.inventory) < quantity) {
                throw new Error("Cart quantity exceeds available inventory.");
              }
            }
          }

          const snapshot = items
            .map((it) => {
              const quantity = Number(it?.quantity ?? 0);
              if (!quantity) return null;

              const product =
                typeof it.product === "object" && it.product
                  ? it.product
                  : undefined;

              const variant =
                typeof it.variant === "object" && it.variant
                  ? (it.variant as Variant)
                  : undefined;

              const productId =
                typeof it.product === "object" ? it.product?.id : it.product;

              if (!productId || !product) return null;

              const optionLabels = (variant?.options ?? [])
                .map((option) =>
                  typeof option === "object" ? option.label : null,
                )
                .filter((label): label is string => Boolean(label));

              const title = optionLabels.length
                ? `${product.title} – ${optionLabels.join(" / ")}`
                : (product.title ?? "");

              const unitPrice = Number(
                variant?.laddex?.retailPriceKobo ?? 0,
              );
              if (!Number.isSafeInteger(unitPrice) || unitPrice < 0) return null;

              return {
                product: productId,
                variant: variant?.id,
                title,
                quantity,
                unitPrice,
                lineTotal: unitPrice * quantity,
              };
            })
            .filter(
              (
                x,
              ): x is {
                product: number;
                variant: number | undefined;
                title: string;
                quantity: number;
                unitPrice: number;
                lineTotal: number;
              } => Boolean(x),
            );

          data.items = paidLineSnapshot ?? snapshot;
          if (!trustedPaystackOrder(req)) data.amount = cart.subtotal;

          return data;
        },
      ],
    },
  };
};
