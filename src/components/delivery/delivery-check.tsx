"use client";

import Link from "next/link";
import { useMemo } from "react";

import { CoverageBadge } from "./coverage-badge";

import { Tag } from "@/components/lx/primitives";
import { estimateDelivery } from "@/features/delivery/pricing";
import { deliveryStore } from "@/features/delivery/store";
import { formatNaira } from "@/lib/formatters";

/** Compact delivery eligibility widget for product pages. Reads the confirmed location, never asks for it again. */
export function DeliveryCheck({
  weightKg,
  className = "",
}: {
  weightKg: number;
  className?: string;
}) {
  const { location, resolution } = deliveryStore.use();
  const hydrated = deliveryStore.useHydrated();
  const estimate = useMemo(
    () => (resolution ? estimateDelivery({ resolution, weightKg }) : null),
    [resolution, weightKg],
  );

  return (
    <section aria-labelledby="dcheck" className={`panel p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="dcheck" className="!text-xl">
          Delivery to your address
        </h2>
        <Tag tone="sample">Sample rates</Tag>
      </div>
      {!hydrated || !location || !resolution || !estimate ? (
        <div className="mt-2">
          <p className="text-sm text-ink-2">
            Choose your state to see the delivery estimate for this order.
          </p>
          <Link href="/delivery" className="btn btn-ink btn-sm min-h-11 mt-3">
            Check my address
          </Link>
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          <p className="text-sm">
            <span className="text-ink-3">To </span>
            <strong>
              {location.addressLine ? location.addressLine : location.label}
            </strong>
            <span className="text-ink-3">
              {resolution.lgaName
                ? `, ${resolution.lgaName}`
                : resolution.stateName
                  ? `, ${resolution.stateName}`
                  : ""}
            </span>
          </p>
          <CoverageBadge resolution={resolution} />
          <ul className="divide-y divide-line text-sm list-none p-0">
            {estimate.options
              .filter((o) => o.available)
              .map((o) => (
                <li
                  key={o.id}
                  className="py-2 flex items-baseline justify-between gap-3"
                >
                  <span>{o.label}</span>
                  <span className="mono">
                    {o.feeKobo === null
                      ? "Quote"
                      : o.feeKobo === 0
                        ? "No charge"
                        : formatNaira(o.feeKobo)}
                  </span>
                </li>
              ))}
          </ul>
          <p className="hint">
            Estimate for about {Math.round(weightKg)} kg. Sample rate, not a
            promise.
          </p>
          <Link
            href="/delivery"
            className="text-sm underline underline-offset-4"
          >
            Change location
          </Link>
        </div>
      )}
    </section>
  );
}
