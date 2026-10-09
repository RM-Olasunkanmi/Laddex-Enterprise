import type { CustomerAccess } from "@/features/customer/types";

import { priceFor } from "@/features/catalogue/pricing";
import { ALL_VARIANTS } from "@/fixtures/products/products";

/**
 * SAMPLE order history for the account area. Prices are recomputed with the storefront pricing
 * function for the persona that "placed" them, so totals always reconcile with the catalogue.
 */
export interface HistoryOrder {
  id: string;
  placedAt: string;
  status: "delivered" | "out-for-delivery" | "processing";
  lines: { variantId: string; qty: number }[];
}

const RETAIL: HistoryOrder[] = [
  {
    id: "SAMPLE-1042",
    placedAt: "2026-09-27T10:12:00+01:00",
    status: "delivered",
    lines: [
      { variantId: "po-5l", qty: 1 },
      { variantId: "tf-1kg", qty: 2 },
    ],
  },
  {
    id: "SAMPLE-1017",
    placedAt: "2026-08-30T15:40:00+01:00",
    status: "delivered",
    lines: [{ variantId: "po-1l", qty: 3 }],
  },
  {
    id: "SAMPLE-0988",
    placedAt: "2026-08-02T09:05:00+01:00",
    status: "delivered",
    lines: [
      { variantId: "gi-5kg", qty: 1 },
      { variantId: "po-5l", qty: 1 },
    ],
  },
];

const WHOLESALE: HistoryOrder[] = [
  {
    id: "SAMPLE-W-218",
    placedAt: "2026-10-01T11:20:00+01:00",
    status: "out-for-delivery",
    lines: [
      { variantId: "gi-25kg", qty: 12 },
      { variantId: "gj-25kg", qty: 8 },
    ],
  },
  {
    id: "SAMPLE-W-203",
    placedAt: "2026-09-17T09:45:00+01:00",
    status: "delivered",
    lines: [{ variantId: "gi-50kg", qty: 4 }],
  },
  {
    id: "SAMPLE-W-190",
    placedAt: "2026-09-03T14:10:00+01:00",
    status: "delivered",
    lines: [
      { variantId: "po-5l", qty: 24 },
      { variantId: "gi-50kg", qty: 4 },
    ],
  },
  {
    id: "SAMPLE-W-171",
    placedAt: "2026-08-14T10:00:00+01:00",
    status: "delivered",
    lines: [{ variantId: "po-5l", qty: 12 }],
  },
];

export function historyFor(access: CustomerAccess) {
  const source =
    access === "wholesale-approved"
      ? WHOLESALE
      : access === "retail"
        ? RETAIL
        : [];
  return source.map((o) => {
    const lines = o.lines.map((l) => {
      const variant = ALL_VARIANTS.find((v) => v.id === l.variantId)!;
      const unit = priceFor(variant, l.qty, access).unitPriceKobo;
      return { ...l, variant, unitKobo: unit, totalKobo: unit * l.qty };
    });
    return {
      ...o,
      lines,
      totalKobo: lines.reduce((s, l) => s + l.totalKobo, 0),
    };
  });
}
