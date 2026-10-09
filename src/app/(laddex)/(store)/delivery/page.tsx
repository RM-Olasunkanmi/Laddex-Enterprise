import { Suspense } from "react";

import type { Metadata } from "next";

import { LocationPicker } from "@/components/delivery/location-picker";
import { Notice } from "@/components/lx/primitives";

export const metadata: Metadata = {
  title: "Delivery",
  description:
    "Find your address on the map and see delivery options for Lagos.",
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
            Search for an address or drop a pin. We check it against the sample
            service zones and show the options and a cost estimate where a
            pricing rule exists.
          </p>
        </div>
        <Notice tone="sample" title="Prototype coverage">
          Zones and fees below are sample configuration. They show how the
          experience will work; they are not Laddex&rsquo;s confirmed delivery
          areas.
        </Notice>
      </header>
      <Suspense fallback={null}>
        <LocationPicker initialQuery={q ?? ""} />
      </Suspense>
    </div>
  );
}
