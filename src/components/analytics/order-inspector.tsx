"use client";

import { Tag } from "@/components/lx/primitives";
import { packLabel } from "@/features/catalogue/selectors";
import { generalise } from "@/features/spatial-intelligence/enrich";
import type { EnrichedOrder } from "@/features/spatial-intelligence/types";
import { SAMPLE_PICKUP_POINTS, SAMPLE_ZONES } from "@/fixtures/geography/zones";
import { ALL_VARIANTS } from "@/fixtures/products/products";
import { formatDate, formatDistanceKm, formatNaira } from "@/lib/formatters";
import { straightLineKm } from "@/lib/geo/distance";
import { useDashboard } from "@/features/spatial-intelligence/state";


const TONE = { delivered: "success", cancelled: "danger", returned: "warning", placed: "info", processing: "info", "out-for-delivery": "info" } as const;

/** Shows ONLY this order's facts. No company-wide figure appears here, so nothing is mistaken for an order attribute. */
export function OrderInspector({ order, onBack, backLabel }: { order: EnrichedOrder; onBack: () => void; backLabel: string }) {
  const { dataset, state } = useDashboard();
  const lga = dataset?.lgas.find((l) => l.id === order.lgaId)?.name ?? null;
  const zone = SAMPLE_ZONES.find((z) => z.id === order.zoneId);
  const pickup = SAMPLE_PICKUP_POINTS.find((p) => p.id === (order.pickupPointId ?? order.nearestPickupId));
  const km = order.location && pickup ? straightLineKm([order.location.lng, order.location.lat], [pickup.position.lng, pickup.position.lat]) : null;
  const shown = order.location ? (state.role === "admin" ? generalise(order.location, 3) : generalise(order.location, 2)) : null;
  return (
    <div className="p-4 space-y-5" data-testid="order-inspector">
      <button className="btn btn-quiet btn-sm -ml-2 underline underline-offset-4" onClick={onBack}>&larr; {backLabel}</button>
      <header>
        <p className="eyebrow">Order</p>
        <h2 className="!text-2xl mono !font-medium mt-1" data-testid="inspector-title">{order.id}</h2>
        <p className="text-sm text-ink-2 mt-1">{formatDate(order.placedAt)} · customer <span className="mono">{order.customerId}</span></p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Tag tone={TONE[order.status]}>{order.status.replace(/-/g, " ")}</Tag>
          <Tag>{order.segment}</Tag>
          <Tag>{order.channel.replace("-", " ")}</Tag>
          <Tag>{order.fulfilment}</Tag>
          {order.synthetic && <Tag tone="sample">Synthetic</Tag>}
        </div>
      </header>

      <section aria-labelledby="oi-lines">
        <h3 id="oi-lines" className="!text-base mb-2">Items</h3>
        <table className="dtable">
          <thead><tr><th scope="col">Pack</th><th scope="col" className="!text-right">Qty</th><th scope="col" className="!text-right">Each</th><th scope="col" className="!text-right">Total</th></tr></thead>
          <tbody>
            {order.lines.map((l) => {
              const v = ALL_VARIANTS.find((x) => x.id === l.variantId)!;
              return <tr key={l.variantId}><td>{l.category === "palm-oil" ? "Palm oil" : "Tapioca"} {packLabel(v)}</td><td className="r">{l.qty}</td><td className="r">{formatNaira(l.unitPriceKobo)}</td><td className="r">{formatNaira(l.lineTotalKobo)}</td></tr>;
            })}
          </tbody>
        </table>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-ink-3">Goods</dt><dd className="mono">{formatNaira(order.goodsKobo)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-3">Delivery fee {order.deliveryFeeBasis === "manual-quote" ? "(manual quote)" : order.deliveryFeeBasis === "zone-rule" ? "(sample zone rule)" : ""}</dt><dd className="mono">{formatNaira(order.deliveryFeeKobo)}</dd></div>
          {order.returnedKobo > 0 && <div className="flex justify-between text-warning"><dt>Returned goods</dt><dd className="mono">-{formatNaira(order.returnedKobo)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-1 font-semibold"><dt>Order total</dt><dd className="mono">{formatNaira(order.goodsKobo + order.deliveryFeeKobo)}</dd></div>
        </dl>
        {order.status === "cancelled" && <p className="hint mt-2">Cancelled orders are excluded from sales figures.</p>}
      </section>

      <section aria-labelledby="oi-geo">
        <h3 id="oi-geo" className="!text-base mb-2">Location</h3>
        {order.location ? (
          <dl className="grid grid-cols-[6.5rem_1fr] gap-y-1.5 text-sm">
            <dt className="text-ink-3">LGA</dt><dd>{lga ?? "Outside the Lagos LGAs"}</dd>
            <dt className="text-ink-3">Sample zone</dt><dd>{zone ? zone.name : lga ? "None" : "—"}</dd>
            <dt className="text-ink-3">{order.fulfilment === "pickup" ? "Collected at" : "Nearest point"}</dt><dd>{pickup?.name.replace("Sample point: ", "")}{km !== null && <span className="block text-xs text-ink-3">{formatDistanceKm(km)} straight line, not road distance</span>}</dd>
            <dt className="text-ink-3">Position</dt><dd className="mono text-xs">{shown!.lat}, {shown!.lng}<span className="block font-sans text-ink-3">{state.role === "admin" ? "Rounded to about 100 m" : "Rounded to about 1 km"}</span></dd>
          </dl>
        ) : (
          <p className="text-sm text-ink-2">This order has no usable location, so it is counted in totals but cannot be placed on the map.</p>
        )}
      </section>
    </div>
  );
}
