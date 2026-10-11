import type { Metadata } from "next";

import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { CHECKOUT_LIVE } from "@/content/business";
import { getDeliveryConfig } from "@/lib/delivery/server";

export const metadata: Metadata = {
  title: CHECKOUT_LIVE ? "Checkout" : "Checkout preview",
  robots: { index: false, follow: false },
};

// Delivery zones are edited in /admin, so read them on every visit.
export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const { isLive } = await getDeliveryConfig();
  // Receipts need a storage provider on serverless hosts: a Vercel function cannot keep files
  // on its own disk. Without one, checkout routes payment through WhatsApp instead of failing
  // after the customer has already paid.
  const receiptUploads =
    !!process.env.STORAGE_PROVIDER || !process.env.VERCEL;
  return (
    <div className="wrap pb-20 pt-8 lg:pt-12">
      <h1 className="display mb-8 text-[2.5rem] sm:text-5xl">
        {CHECKOUT_LIVE ? "Checkout" : "Checkout preview"}
      </h1>
      <CheckoutFlow
        capabilities={{ receiptUploads, deliveryRatesLive: isLive }}
      />
    </div>
  );
}
