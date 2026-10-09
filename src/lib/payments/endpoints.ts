import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { Endpoint, PayloadRequest } from "payload";

import {
  optionalText,
  readBoundedJson,
  RequestValidationError,
  requiredText,
} from "@/lib/checkout/request";
import { priceLines } from "@/lib/checkout/server";
import appConfig from "@/lib/core/config";
import { resolveAndEstimate } from "@/lib/delivery/server";
import {
  initializeTransaction,
  paystackConfig,
  refundTransaction,
  verifyTransaction,
} from "@/lib/payments/paystack";

type InitializeBody = {
  lines?: { variantId?: unknown; qty?: unknown }[];
  email?: unknown;
  name?: unknown;
  phone?: unknown;
  fulfilment?: unknown;
  position?: { lng?: unknown; lat?: unknown };
  label?: unknown;
  street?: unknown;
  landmark?: unknown;
  notes?: unknown;
  state?: unknown;
  lga?: unknown;
  idempotencyKey?: unknown;
};

type SessionDoc = {
  id: number;
  reference: string;
  authorizationUrl?: string | null;
  cart: number | { id: number };
  name: string;
  phone: string;
  email: string;
  address?: {
    street?: string | null;
    landmark?: string | null;
    notes?: string | null;
    locationLabel?: string | null;
    state?: string | null;
    lga?: string | null;
    lng?: number | null;
    lat?: number | null;
  } | null;
  fulfilment: "delivery" | "pickup";
  goodsTotalKobo: number;
  deliveryTotalKobo: number;
  grandTotalKobo: number;
  feeBasis: "region-rule" | "manual-quote" | "none";
  currency: "NGN";
  status: string;
  order?: number | { id: number } | null;
};

const relationID = (value: number | { id: number }) =>
  typeof value === "object" ? value.id : value;

const initializeEndpoint: Endpoint = {
  path: "/paystack/initialize",
  method: "post",
  handler: async (req) => {
    if (!paystackConfig.ENABLED || !paystackConfig.SECRET_KEY) {
      return Response.json({ message: "Paystack checkout is disabled." }, { status: 404 });
    }
    const catalogueSource =
      process.env.LADDEX_CATALOGUE_SOURCE ??
      (process.env.NODE_ENV === "production" ? "payload" : "fixture");
    if (catalogueSource !== "payload") {
      return Response.json(
        { message: "Card payment needs the live catalogue.", whatsappFallback: true },
        { status: 409 },
      );
    }

    try {
      const data = await readBoundedJson<InitializeBody>(req as Request);
      const idempotencyKey = requiredText(
        data.idempotencyKey,
        "idempotency key",
        100,
        16,
      );
      const previous = await req.payload.find({
        collection: "checkout-sessions",
        depth: 0,
        limit: 1,
        pagination: false,
        overrideAccess: true,
        where: { idempotencyKey: { equals: idempotencyKey } },
      });
      const previousSession = previous.docs[0] as SessionDoc | undefined;
      if (
        previousSession?.status === "initialized" &&
        previousSession.authorizationUrl
      ) {
        return Response.json({
          authorizationUrl: previousSession.authorizationUrl,
          reference: previousSession.reference,
        });
      }
      if (previousSession) {
        return Response.json(
          { message: "This checkout attempt is already being processed." },
          { status: 409 },
        );
      }
      const email = requiredText(data.email, "email", 254).toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new RequestValidationError("A valid email is required.");
      }
      const name = requiredText(data.name, "name", 120, 2);
      const phone = requiredText(data.phone, "phone", 32, 7);
      const fulfilment = data.fulfilment === "pickup" ? "pickup" : "delivery";
      const street = optionalText(data.street, "street", 240);
      const landmark = optionalText(data.landmark, "landmark", 240);
      const notes = optionalText(data.notes, "notes", 1000);
      const locationLabel = optionalText(data.label, "location label", 240);
      const suppliedState = optionalText(data.state, "state", 100);
      const suppliedLga = optionalText(data.lga, "LGA", 100);
      const lng = Number(data.position?.lng);
      const lat = Number(data.position?.lat);

      if (fulfilment === "delivery") {
        if (street.length < 4) throw new RequestValidationError("street is required for delivery.");
        if (!Number.isFinite(lng) || lng < -180 || lng > 180 || !Number.isFinite(lat) || lat < -90 || lat > 90) {
          throw new RequestValidationError("Valid delivery coordinates are required.");
        }
      }

      const priced = await priceLines(data.lines ?? [], req.payload);
      if (priced.goodsKobo < 1) {
        throw new RequestValidationError("Cart total must be greater than zero.");
      }
      const items = priced.lines.map((line) => ({
        product: line.payloadProductId,
        variant: line.payloadVariantId,
        quantity: line.qty,
      }));
      const cart = await req.payload.create({ collection: "carts", data: { items }, req });

      let deliveryTotalKobo = 0;
      let feeBasis: SessionDoc["feeBasis"] = "none";
      let state = suppliedState;
      let lga = suppliedLga;
      let paymentAllowed = true;

      if (fulfilment === "delivery") {
        const resolved = await resolveAndEstimate({ lng, lat }, priced.weightKg);
        state = resolved.resolution.stateName ?? state;
        lga = resolved.resolution.lgaName ?? lga;
        const home = resolved.estimate.options.find((option) => option.id === "home");
        if (resolved.isLive && home?.available && home.feeKobo !== null) {
          deliveryTotalKobo = home.feeKobo;
          feeBasis = "region-rule";
        } else {
          feeBasis = "manual-quote";
          paymentAllowed = false;
        }
      }

      const reference = `laddex_${randomBytes(16).toString("hex")}`;
      const session = await req.payload.create({
        collection: "checkout-sessions",
        data: {
          reference,
          idempotencyKey,
          cart: cart.id,
          lines: priced.lines.map((line) => ({
            product: line.payloadProductId,
            variant: line.payloadVariantId,
            title: line.label,
            quantity: line.qty,
            unitPriceKobo: line.unitKobo,
            lineTotalKobo: line.totalKobo,
          })),
          name,
          phone,
          email,
          address: {
            street,
            landmark,
            notes,
            locationLabel,
            state,
            lga,
            lng: Number.isFinite(lng) ? lng : undefined,
            lat: Number.isFinite(lat) ? lat : undefined,
          },
          fulfilment,
          goodsTotalKobo: priced.goodsKobo,
          deliveryTotalKobo,
          grandTotalKobo: priced.goodsKobo + deliveryTotalKobo,
          feeBasis,
          currency: "NGN",
          status: paymentAllowed ? "created" : "failed",
          failureReason: paymentAllowed ? undefined : "Delivery fee requires a manual quote.",
        },
        req,
      });

      if (!paymentAllowed) {
        return Response.json(
          {
            message: "Delivery must be quoted before online payment.",
            reference,
            feeBasis: "manual-quote",
            goodsTotalKobo: priced.goodsKobo,
            deliveryTotalKobo: 0,
            whatsappFallback: true,
          },
          { status: 409 },
        );
      }

      try {
        const result = await initializeTransaction({
          email,
          amountKobo: priced.goodsKobo + deliveryTotalKobo,
          reference,
          callbackUrl: `${appConfig.BASE_URL}/order/confirmation`,
          metadata: {
            checkoutSessionId: String(session.id),
            cartId: String(cart.id),
          },
        });
        await req.payload.update({
          collection: "checkout-sessions",
          id: session.id,
          data: {
            status: "initialized",
            authorizationUrl: result.authorizationUrl,
          },
          req,
        });
        return Response.json(result);
      } catch (error) {
        await req.payload.update({
          collection: "checkout-sessions",
          id: session.id,
          data: { status: "failed", failureReason: "Paystack initialization failed." },
          req,
        });
        throw error;
      }
    } catch (error) {
      if (error instanceof RequestValidationError) {
        return Response.json({ message: error.message }, { status: error.status });
      }
      req.payload.logger.error(error, "Error initializing Paystack payment.");
      return Response.json({ message: "Unable to start payment." }, { status: 500 });
    }
  },
};

function signatureValid(rawBody: string, signature: string | null) {
  if (!signature || !paystackConfig.SECRET_KEY || !/^[a-f\d]{128}$/i.test(signature)) return false;
  const digest = createHmac("sha512", paystackConfig.SECRET_KEY).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === digest.length && timingSafeEqual(received, digest);
}

async function createOrderFromCharge(req: PayloadRequest, reference: string) {
  const txn = await verifyTransaction(reference);
  if (txn.status !== "success" || txn.reference !== reference) {
    throw new Error("Paystack transaction is not successful.");
  }

  const sessions = await req.payload.find({
    collection: "checkout-sessions",
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    where: { reference: { equals: reference } },
  });
  const session = sessions.docs[0] as SessionDoc | undefined;
  if (!session) throw new Error("Checkout session was not found.");

  const cartId = relationID(session.cart);
  if (
    txn.metadata?.checkoutSessionId !== String(session.id) ||
    txn.metadata?.cartId !== String(cartId) ||
    txn.customer?.email?.trim().toLowerCase() !== session.email.trim().toLowerCase() ||
    txn.currency?.toUpperCase() !== session.currency ||
    Number(txn.amount) !== Number(session.grandTotalKobo)
  ) {
    throw new Error("Paystack transaction does not match its checkout session.");
  }
  if (session.feeBasis === "manual-quote") {
    throw new Error("A manual delivery quote cannot be paid online.");
  }

  const existing = await req.payload.find({
    collection: "orders",
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    where: { paymentIntentId: { equals: reference } },
  });
  if (existing.docs[0]) {
    await req.payload.update({
      collection: "checkout-sessions",
      id: session.id,
      data: { status: "order-created", order: existing.docs[0].id },
      req,
    });
    return;
  }

  await req.payload.update({
    collection: "checkout-sessions",
    id: session.id,
    data: { status: "paid" },
    req,
  });
  req.context ??= {};
  req.context.trustedOrderSource = "paystack-webhook";
  let order;
  try {
    order = await req.payload.create({
      collection: "orders",
      data: {
        checkoutSession: session.id,
        cart: cartId,
        name: session.name,
        phone: session.phone,
        email: session.email,
        items: [],
        paymentIntentId: reference,
      },
      req,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/inventory|available stock/i.test(message)) throw error;

    await refundTransaction(reference, session.grandTotalKobo);
    await req.payload.update({
      collection: "checkout-sessions",
      id: session.id,
      data: {
        status: "failed",
        failureReason: "Inventory changed after payment; a full refund was requested.",
      },
      req,
    });
    return;
  }
  await req.payload.update({
    collection: "checkout-sessions",
    id: session.id,
    data: { status: "order-created", order: order.id },
    req,
  });
}

const webhookEndpoint: Endpoint = {
  path: "/paystack/webhook",
  method: "post",
  handler: async (req) => {
    if (!paystackConfig.ENABLED) return Response.json({ received: true });

    const declared = Number(req.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > 256 * 1024) {
      return Response.json({ message: "Request body is too large." }, { status: 413 });
    }
    const rawBody = (await req.text?.()) ?? "";
    if (Buffer.byteLength(rawBody, "utf8") > 256 * 1024) {
      return Response.json({ message: "Request body is too large." }, { status: 413 });
    }
    if (!signatureValid(rawBody, req.headers.get("x-paystack-signature"))) {
      return Response.json({ message: "Invalid signature." }, { status: 400 });
    }

    let event: { event?: unknown; data?: { reference?: unknown } };
    try {
      event = JSON.parse(rawBody) as typeof event;
    } catch {
      return Response.json({ message: "Invalid body." }, { status: 400 });
    }
    if (event.event !== "charge.success") return Response.json({ received: true });
    if (typeof event.data?.reference !== "string" || event.data.reference.length > 100) {
      return Response.json({ message: "Invalid reference." }, { status: 400 });
    }

    try {
      await createOrderFromCharge(req, event.data.reference);
      return Response.json({ received: true });
    } catch (error) {
      req.payload.logger.error(error, "Error durably creating order from Paystack webhook.");
      return Response.json({ message: "Order persistence failed." }, { status: 500 });
    }
  },
};

const confirmationEndpoint: Endpoint = {
  path: "/paystack/confirmation",
  method: "get",
  handler: async (req) => {
    const reference = new URL(req.url ?? "", appConfig.BASE_URL).searchParams.get("reference");
    if (!reference || reference.length > 100) {
      return Response.json({ message: "reference is required." }, { status: 400 });
    }
    const result = await req.payload.find({
      collection: "checkout-sessions",
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      where: { reference: { equals: reference } },
    });
    const session = result.docs[0] as SessionDoc | undefined;
    if (!session) return Response.json({ message: "Not found." }, { status: 404 });
    return Response.json({
      reference: session.reference,
      status: session.status,
      orderId: session.order ? relationID(session.order) : null,
      currency: session.currency,
      goodsTotalKobo: session.goodsTotalKobo,
      deliveryTotalKobo: session.deliveryTotalKobo,
      grandTotalKobo: session.grandTotalKobo,
      feeBasis: session.feeBasis,
    });
  },
};

export const paystackEndpoints: Endpoint[] = [
  initializeEndpoint,
  webhookEndpoint,
  confirmationEndpoint,
];
