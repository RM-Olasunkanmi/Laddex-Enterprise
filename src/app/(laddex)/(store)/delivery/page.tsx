import { Suspense } from "react";

import type { Metadata } from "next";

import { LocationPicker } from "@/components/delivery/location-picker";
import { Notice } from "@/components/lx/primitives";

export const metadata: Metadata = {
  title: "Delivery",
  description:
    "Find your address on the map and see delivery options anywhere in Nigeria.",
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
            We deliver to every state in Nigeria. Search for a town, choose your
            state and area, or drop a pin to see the delivery options and an
            estimate for your order weight.
          </p>
        </div>
        <Notice tone="sample" title="Sample rates">
          Delivery is nationwide. The fees below are sample rates per region and
          weight band, not Laddex&rsquo;s confirmed prices.
        </Notice>
      </header>
      <Suspense fallback={null}>
        <LocationPicker initialQuery={q ?? ""} />
      </Suspense>
    </div>
  );
}
