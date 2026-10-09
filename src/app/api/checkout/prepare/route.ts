import {
  readBoundedJson,
  RequestValidationError,
} from "@/lib/checkout/request";
import { priceLines } from "@/lib/checkout/server";
import { resolveAndEstimate } from "@/lib/delivery/server";

/**
 * POST /api/checkout/prepare — server-side totals for a cart. The storefront
 * calls this before payment so the charged figures come from the catalogue
 * and delivery rules, never from client state.
 *
 * Body: { lines: [{ variantId, qty }], position?: { lng, lat }, fulfilment?: "delivery" | "pickup" }
 */
export async function POST(req: Request) {
  let body: {
    lines?: { variantId?: unknown; qty?: unknown }[];
    position?: { lng?: unknown; lat?: unknown };
    fulfilment?: unknown;
  };
  try {
    body = await readBoundedJson(req);
  } catch (error) {
    const status = error instanceof RequestValidationError ? error.status : 400;
    return Response.json(
      { message: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }

  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return Response.json({ message: "lines must be a non-empty array." }, { status: 400 });
  }

  let priced;
  try {
    priced = await priceLines(body.lines);
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to price cart." },
      { status: error instanceof RequestValidationError ? error.status : 500 },
    );
  }

  const fulfilment = body.fulfilment === "pickup" ? "pickup" : "delivery";
  let delivery: {
    feeKobo: number | null;
    feeBasis: "region-rule" | "quote-required" | "none";
  } = { feeKobo: null, feeBasis: "none" };

  if (fulfilment === "pickup") {
    delivery = { feeKobo: 0, feeBasis: "none" };
  } else if (
    typeof body.position?.lng === "number" &&
    typeof body.position?.lat === "number"
  ) {
    const { estimate, isLive } = await resolveAndEstimate(
      { lng: body.position.lng, lat: body.position.lat },
      priced.weightKg,
    );
    const home = estimate.options.find((o) => o.id === "home");
    delivery =
      isLive && home?.available && home.feeKobo !== null
        ? { feeKobo: home.feeKobo, feeBasis: "region-rule" }
        : { feeKobo: null, feeBasis: "quote-required" };
  }

  return Response.json({
    lines: priced.lines,
    goodsKobo: priced.goodsKobo,
    weightKg: priced.weightKg,
    fulfilment,
    delivery,
    totalKobo: priced.goodsKobo + (delivery.feeKobo ?? 0),
  });
}
