import { Suspense } from "react";

import type { Metadata } from "next";

import { LocationPicker } from "@/components/delivery/location-picker";
import { Notice } from "@/components/lx/primitives";

export const metadata: Metadata = {
  title: "Delivery",
  description:
    "Find your address and request a delivery availability check from Laddex.",
};

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div className="wrap py-10">
      <header className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow mb-3">Delivery</p>
          <h1 className="text-4xl md:text-5xl mt-1">
            Where should we deliver?
          </h1>
          <p className="mt-3 text-ink-2 max-w-xl">
            Search for a town, choose your state and area, or drop a pin to see
            an illustrative estimate. Confirm availability and the current fee
            with Laddex before ordering.
          </p>
        </div>
        <Notice tone="sample" title="Availability must be confirmed">
          The fees below are illustrative rates per region and weight band, not
          confirmed delivery coverage or prices.
        </Notice>
      </header>
      <Suspense fallback={null}>
        <LocationPicker initialQuery={q ?? ""} />
      </Suspense>
    </div>
  );
}
