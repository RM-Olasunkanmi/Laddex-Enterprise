import { randomBytes } from "node:crypto";

import config from "@payload-config";
import { getPayload } from "payload";

import { BANK_TRANSFER_ENABLED } from "@/content/business";
import { optionalText, RequestValidationError, requiredText } from "@/lib/checkout/request";
import { priceLines } from "@/lib/checkout/server";
import { resolveAndEstimate } from "@/lib/delivery/server";

export const runtime = "nodejs";

// Vercel rejects request bodies over 4.5 MB, so stay safely under it.
const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;
const MAX_FIELDS_BYTES = 32 * 1024;
const MAX_PENDING_PER_PHONE = 5;
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type Body = {
  lines?: { variantId?: unknown; qty?: unknown }[];
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  street?: unknown;
  landmark?: unknown;
  notes?: unknown;
  label?: unknown;
  state?: unknown;
  lga?: unknown;
  fulfilment?: unknown;
  position?: { lng?: unknown; lat?: unknown };
  idempotencyKey?: unknown;
  payerName?: unknown;
  payerBank?: unknown;
  amountPaidNaira?: unknown;
  paidAt?: unknown;
  transferReference?: unknown;
};

/** Detect the real file type from its first bytes; never trust the browser's MIME. */
function sniffMime(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.subarray(0, 4).toString("latin1") === "%PDF") return "application/pdf";
  if (bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}

const makeReference = () =>
  `LDX-${Array.from(randomBytes(8), (b) => REFERENCE_ALPHABET[b % REFERENCE_ALPHABET.length]).join("")}`;

/**
 * POST /api/orders/bank-transfer (multipart: `data` JSON + `receipt` file).
 * Stores a pending order with the customer's proof of payment. Nothing is an order
 * (and no stock moves) until staff confirm the money arrived.
 */
export async function POST(req: Request) {
  if (!BANK_TRANSFER_ENABLED) {
    return Response.json({ message: "Bank transfer checkout is not available." }, { status: 404 });
  }
  const catalogueSource =
    process.env.LADDEX_CATALOGUE_SOURCE ??
    (process.env.NODE_ENV === "production" ? "payload" : "fixture");
  if (catalogueSource !== "payload") {
    return Response.json(
      { message: "Ordering needs the live catalogue.", whatsappFallback: true },
      { status: 409 },
    );
  }

  try {
    const declared = Number(req.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_RECEIPT_BYTES + MAX_FIELDS_BYTES) {
      throw new RequestValidationError("Upload is too large. Receipts must be under 4 MB.", 413);
    }
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new RequestValidationError("Invalid upload.");
    }

    const rawData = form.get("data");
    if (typeof rawData !== "string" || Buffer.byteLength(rawData) > MAX_FIELDS_BYTES) {
      throw new RequestValidationError("Invalid order details.");
    }
    let data: Body;
    try {
      data = JSON.parse(rawData) as Body;
    } catch {
      throw new RequestValidationError("Invalid order details.");
    }

    const file = form.get("receipt");
    if (!(file instanceof File) || file.size === 0) {
      throw new RequestValidationError("Attach your payment receipt.");
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      throw new RequestValidationError("Receipt is too large. Use a file under 4 MB.", 413);
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const mimetype = sniffMime(bytes);
    if (!mimetype) {
      throw new RequestValidationError("Receipt must be a JPG, PNG, WebP or PDF file.");
    }

    const idempotencyKey = requiredText(data.idempotencyKey, "idempotencyKey", 100, 16);
    const name = requiredText(data.name, "name", 120, 2);
    const phone = requiredText(data.phone, "phone", 32, 7);
    const email = requiredText(data.email, "email", 200, 5).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new RequestValidationError("Enter a valid email address.");
    const fulfilment = data.fulfilment === "pickup" ? "pickup" : "delivery";
    const street = optionalText(data.street, "street", 240);
    const landmark = optionalText(data.landmark, "landmark", 240);
    const notes = optionalText(data.notes, "notes", 1000);
    const locationLabel = optionalText(data.label, "location label", 240);
    const suppliedState = optionalText(data.state, "state", 100);
    const suppliedLga = optionalText(data.lga, "LGA", 100);
    const payerName = requiredText(data.payerName, "Account name", 120, 2);
    const payerBank = requiredText(data.payerBank, "Bank", 120, 2);
    const transferReference = optionalText(data.transferReference, "transfer reference", 120);
    const amountNaira = Number(data.amountPaidNaira);
    if (!Number.isFinite(amountNaira) || amountNaira <= 0 || amountNaira > 100_000_000) {
      throw new RequestValidationError("Enter the amount you transferred.");
    }
    const amountPaidKobo = Math.round(amountNaira * 100);
    const paidAtText = requiredText(data.paidAt, "Transfer date", 10, 10);
    const paidAt = new Date(`${paidAtText}T12:00:00Z`);
    const now = Date.now();
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(paidAtText) ||
      Number.isNaN(paidAt.getTime()) ||
      paidAt.getTime() > now + 36 * 3600_000 ||
      paidAt.getTime() < now - 30 * 24 * 3600_000
    ) {
      throw new RequestValidationError("Transfer date must be within the last 30 days.");
    }

    const lng = Number(data.position?.lng);
    const lat = Number(data.position?.lat);
    if (fulfilment === "delivery") {
      if (street.length < 4) throw new RequestValidationError("street is required for delivery.");
      if (!Number.isFinite(lng) || lng < -180 || lng > 180 || !Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new RequestValidationError("Valid delivery coordinates are required.");
      }
    }

    const payload = await getPayload({ config });

    // A double click or retry returns the same pending order instead of a duplicate.
    const existing = await payload.find({
      collection: "checkout-sessions",
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      where: { idempotencyKey: { equals: idempotencyKey } },
    });
    if (existing.docs[0]) {
      return Response.json({ reference: existing.docs[0].reference, duplicate: true });
    }

    const pending = await payload.count({
      collection: "checkout-sessions",
      overrideAccess: true,
      where: {
        and: [
          { phone: { equals: phone } },
          { status: { equals: "awaiting-verification" } },
        ],
      },
    });
    if (pending.totalDocs >= MAX_PENDING_PER_PHONE) {
      throw new RequestValidationError(
        "You already have several payments waiting to be checked. Please wait for our confirmation or contact us on WhatsApp.",
        429,
      );
    }

    const priced = await priceLines(data.lines ?? [], payload);
    if (priced.goodsKobo < 1) throw new RequestValidationError("Cart total must be greater than zero.");

    let deliveryTotalKobo = 0;
    let feeBasis: "region-rule" | "none" = "none";
    let state = suppliedState;
    let lga = suppliedLga;
    if (fulfilment === "delivery") {
      const resolved = await resolveAndEstimate({ lng, lat }, priced.weightKg);
      state = resolved.resolution.stateName ?? state;
      lga = resolved.resolution.lgaName ?? lga;
      const home = resolved.estimate.options.find((option) => option.id === "home");
      if (!(resolved.isLive && home?.available && home.feeKobo !== null)) {
        return Response.json(
          {
            message:
              "Delivery to this location needs a quote first, so we cannot take a transfer yet. Please order on WhatsApp.",
            whatsappFallback: true,
          },
          { status: 409 },
        );
      }
      deliveryTotalKobo = home.feeKobo;
      feeBasis = "region-rule";
    }
    const grandTotalKobo = priced.goodsKobo + deliveryTotalKobo;

    const receipt = await payload.create({
      collection: "payment-receipts",
      data: {},
      file: { data: bytes, mimetype, name: `receipt.${mimetype === "application/pdf" ? "pdf" : mimetype.split("/")[1]}`, size: bytes.length },
      overrideAccess: true,
    });
    const cart = await payload.create({
      collection: "carts",
      data: {
        items: priced.lines.map((line) => ({
          product: line.payloadProductId,
          variant: line.payloadVariantId,
          quantity: line.qty,
        })),
      },
      overrideAccess: true,
    });

    const reference = makeReference();
    await payload.create({
      collection: "checkout-sessions",
      overrideAccess: true,
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
        grandTotalKobo,
        feeBasis,
        currency: "NGN",
        status: "awaiting-verification",
        payment: {
          method: "bank-transfer",
          payerName,
          payerBank,
          amountPaidKobo,
          paidAt: paidAt.toISOString(),
          transferReference,
          receipt: receipt.id,
        },
      },
    });

    return Response.json({ reference, totalKobo: grandTotalKobo });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    console.error("Bank transfer order failed", error);
    return Response.json({ message: "We could not save your order. Please try again or order on WhatsApp." }, { status: 500 });
  }
}
