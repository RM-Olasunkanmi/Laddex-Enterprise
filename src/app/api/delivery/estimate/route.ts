import { resolveAndEstimate } from "@/lib/delivery/server";
import { straightLineKm } from "@/lib/geo/distance";
import { STORE } from "@/lib/store";

/**
 * POST /api/delivery/estimate — the coverage answer as an API, per
 * docs/BACKEND_INTEGRATION.md §4. Nationwide: the point is joined to its
 * state and geopolitical region against bundled boundaries (Cloudflare-safe,
 * no disk reads), then priced over operations-owned regions when Payload has
 * active rows, else the sample fixtures. The response says which via `isLive`.
 *
 * Body: { position: { lng, lat }, weightKg: number }
 */
export async function POST(req: Request) {
  let body: { position?: { lng?: unknown; lat?: unknown }; weightKg?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const lng = Number(body.position?.lng);
  const lat = Number(body.position?.lat);
  const weightKg = Number(body.weightKg);
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || !(weightKg > 0)) {
    return Response.json(
      { message: "position { lng, lat } and a positive weightKg are required." },
      { status: 400 },
    );
  }

  const { resolution, estimate, isLive, disclaimer, points } =
    await resolveAndEstimate({ lng, lat }, weightKg);

  return Response.json({
    resolution,
    estimate,
    isLive,
    disclaimer: disclaimer || undefined,
    storeKm: straightLineKm(
      [lng, lat],
      [STORE.position.lng, STORE.position.lat],
    ),
    store: { name: STORE.name, position: STORE.position, verified: true },
    verifiedPoints: points,
  });
}
