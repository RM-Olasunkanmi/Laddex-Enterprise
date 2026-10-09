import type { Metadata } from "next";

import { QuoteBuilder } from "@/components/wholesale/quote-builder";

export const metadata: Metadata = { title: "Request a wholesale quote" };

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string }>;
}) {
  const { pack } = await searchParams;
  return (
    <div className="wrap py-10">
      <p className="eyebrow mb-2">Wholesale</p>
      <h1 className="text-4xl md:text-5xl mb-3">Request a quote</h1>
      <p className="text-ink-2 max-w-xl mb-8">
        List the packs and quantities you need. You see an indicative total as
        you build the request, and staff confirm the real price in writing.
      </p>
      <QuoteBuilder initialPack={pack} />
    </div>
  );
}
