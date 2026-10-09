import config from "@payload-config";
import { getPayload } from "payload";

import type {
  Channel,
  EnrichedOrder,
  OrderLine,
  OrderRecord,
  Segment,
} from "@/features/spatial-intelligence/types";
import type { Kobo } from "@/lib/formatters";

import {
  assignLgas,
  enrichOrders,
  generalise,
} from "@/features/spatial-intelligence/enrich";
import { getLagosLgasSync, getStatesSync } from "@/lib/geo/states-data";

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_MAP: Record<string, EnrichedOrder["status"]> = {
  new: "placed",
  ready: "processing",
  done: "delivered",
  canceled: "cancelled",
  refunded: "returned",
};

const isAdmin = (user: any) =>
  Array.isArray(user?.roles) && user.roles.includes("admin");
const isAnalyst = (user: any) =>
  Array.isArray(user?.roles) && user.roles.includes("analyst");

/**
 * GET /api/analytics/orders — authenticated orders API per
 * docs/BACKEND_INTEGRATION.md §5. Query params: from, to (YYYY-MM-DD
 * Africa/Lagos), category, variant, segment, channel, status (repeatable).
 *
 * Reads Payload orders with the `laddex` fulfilment group, spatial-joins
 * against the bundled state boundaries (plus Lagos LGAs), and maps plugin
 * statuses to dashboard statuses. Admins receive exact coordinates; other
 * signed-in users receive generalised points; anonymous callers get 401.
 * Exact coordinates are personal data — never widen this without review.
 */
export async function GET(req: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return Response.json({ message: "Sign in required." }, { status: 401 });
  }
  const admin = isAdmin(user);
  if (!admin && !isAnalyst(user)) {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = (name: string) => url.searchParams.getAll(name);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (
    req.url.length > 8192 ||
    (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) ||
    (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) ||
    ["category", "variant", "segment", "channel", "status"].reduce(
      (count, key) => count + q(key).length,
      0,
    ) > 50
  ) {
    return Response.json({ message: "Invalid or excessive query filters." }, { status: 400 });
  }

  const ordersRes = await payload.find({
    collection: "orders",
    depth: 0,
    limit: 500,
    pagination: false,
    sort: "-createdAt",
  });
  const docs = ordersRes.docs as Record<string, any>[];

  // Resolve item snapshots to catalogue categories and pack contents.
  const variantIds = [
    ...new Set(
      docs.flatMap((o) =>
        (Array.isArray(o.items) ? o.items : [])
          .map((i: any) => i?.variant)
          .filter((v: any) => v != null),
      ),
    ),
  ];
  const variantDocs = new Map<number, any>();
  await Promise.all(
    variantIds.map(async (id) => {
      try {
        const v = await payload.findByID({ collection: "variants", id, depth: 0 });
        variantDocs.set(Number(id), v);
      } catch {
        // Deleted variant: its lines are dropped below, the order is kept.
      }
    }),
  );
  const productDocs = new Map<number, any>();
  const productIds = [
    ...new Set(
      [...variantDocs.values()]
        .map((v: any) =>
          typeof v?.product === "object" ? v.product?.id : v?.product,
        )
        .filter((p: any) => p != null),
    ),
  ];
  await Promise.all(
    productIds.map(async (id) => {
      try {
        const p = await payload.findByID({
          collection: "products",
          id,
          depth: 0,
          select: { laddex: true },
        });
        productDocs.set(Number(id), p);
      } catch {
        // Deleted product: its lines are dropped below.
      }
    }),
  );

  // Wholesale segment comes from the buying account, not the cart.
  const customerIds = [
    ...new Set(
      docs
        .map((o) =>
          typeof o.customer === "object" ? o.customer?.id : o.customer,
        )
        .filter((c) => c != null),
    ),
  ];
  const wholesaleCustomers = new Set<number>();
  await Promise.all(
    customerIds.map(async (id) => {
      try {
        const u: any = await payload.findByID({
          collection: "users",
          id,
          depth: 0,
          select: { wholesaleStatus: true },
        });
        if (u?.wholesaleStatus === "approved")
          wholesaleCustomers.add(Number(id));
      } catch {
        // Deleted user: treated as retail.
      }
    }),
  );

  const records: OrderRecord[] = docs.map((o) => {
    const laddex = o.laddex ?? {};
    const lines: OrderLine[] = (
      Array.isArray(o.items) ? o.items : []
    ).flatMap((i: any) => {
      const v = variantDocs.get(Number(i?.variant));
      const pid = typeof v?.product === "object" ? v.product?.id : v?.product;
      const p = productDocs.get(Number(pid));
      const category = p?.laddex?.category;
      if (!category || !["palm-oil", "tapioca", "garri"].includes(category))
        return [];
      const contentBase = Number(v?.laddex?.contentBase ?? 0);
      const qty = Number(i?.quantity ?? 0);
      const unitPriceKobo = Number(i?.unitPrice ?? 0) as Kobo;
      return [
        {
          variantId: `v${Number(i?.variant)}`,
          category,
          qty,
          unitPriceKobo,
          lineTotalKobo: Number(i?.lineTotal ?? unitPriceKobo * qty) as Kobo,
          baseUnits: contentBase * qty,
        },
      ];
    });
    const goodsKobo = (Number(
      o.amount ?? lines.reduce((s, l) => s + l.lineTotalKobo, 0),
    ) || 0) as Kobo;
    const status = STATUS_MAP[String(o.status ?? "new")] ?? "placed";
    const customerId =
      typeof o.customer === "object" ? o.customer?.id : o.customer;
    return {
      id: String(o.id),
      customerId: customerId != null ? String(customerId) : "guest",
      segment: (customerId != null && wholesaleCustomers.has(Number(customerId))
        ? "wholesale"
        : "retail") as Segment,
      channel: (["online", "phone", "sales-desk"].includes(laddex.channel)
        ? laddex.channel
        : "online") as Channel,
      placedAt: String(o.createdAt),
      status,
      location:
        laddex.lng != null && laddex.lat != null
          ? { lng: Number(laddex.lng), lat: Number(laddex.lat) }
          : null,
      lines,
      goodsKobo,
      deliveryFeeKobo: (Number(laddex.feeKobo ?? 0) || 0) as Kobo,
      deliveryFeeBasis: (["region-rule", "manual-quote"].includes(
        laddex.feeBasis,
      )
        ? laddex.feeBasis
        : "manual-quote") as OrderRecord["deliveryFeeBasis"],
      returnedKobo: (status === "returned" ? goodsKobo : 0) as Kobo,
      synthetic: false,
    };
  });

  const states = getStatesSync();
  const withLgas = assignLgas(
    enrichOrders(records, states),
    "lagos",
    getLagosLgasSync(),
  );

  const inRange = (iso: string) => {
    const day = iso.slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  };
  const cats = q("category"),
    variants = q("variant"),
    segs = q("segment"),
    chans = q("channel"),
    stats = q("status");
  const filtered = withLgas.filter(
    (o) =>
      inRange(o.placedAt) &&
      (cats.length === 0 ||
        o.lines.some((l) => cats.includes(l.category))) &&
      (variants.length === 0 ||
        o.lines.some((l) => variants.includes(l.variantId))) &&
      (segs.length === 0 || segs.includes(o.segment)) &&
      (chans.length === 0 || chans.includes(o.channel)) &&
      (stats.length === 0 || stats.includes(o.status)),
  );

  if (admin) {
    return Response.json({ orders: filtered, total: filtered.length, role: "admin" });
  }

  const grouped = new Map<
    string,
    {
      day: string;
      regionId: string | null;
      stateId: string | null;
      lgaId: string | null;
      segment: Segment;
      channel: Channel;
      status: EnrichedOrder["status"];
      location: { lng: number; lat: number } | null;
      orderCount: number;
      goodsKobo: number;
      deliveryFeeKobo: number;
      returnedKobo: number;
      itemQuantity: number;
    }
  >();
  for (const order of filtered) {
    const day = order.placedAt.slice(0, 10);
    const key = [
      day,
      order.regionId ?? "",
      order.stateId ?? "",
      order.lgaId ?? "",
      order.segment,
      order.channel,
      order.status,
    ].join("|");
    const current = grouped.get(key) ?? {
      day,
      regionId: order.regionId,
      stateId: order.stateId,
      lgaId: order.lgaId,
      segment: order.segment,
      channel: order.channel,
      status: order.status,
      location: order.location ? generalise(order.location) : null,
      orderCount: 0,
      goodsKobo: 0,
      deliveryFeeKobo: 0,
      returnedKobo: 0,
      itemQuantity: 0,
    };
    current.orderCount += 1;
    current.goodsKobo += order.goodsKobo;
    current.deliveryFeeKobo += order.deliveryFeeKobo;
    current.returnedKobo += order.returnedKobo;
    current.itemQuantity += order.lines.reduce((sum, line) => sum + line.qty, 0);
    grouped.set(key, current);
  }

  return Response.json({
    aggregates: Array.from(grouped.values()),
    total: filtered.length,
    role: "analyst",
  });
}
