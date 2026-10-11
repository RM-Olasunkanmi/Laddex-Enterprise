import type { Metadata } from "next";

import { CheckoutPreview } from "@/components/checkout/checkout-preview";
import { CHECKOUT_LIVE } from "@/content/business";

export const metadata: Metadata = {
  title: CHECKOUT_LIVE ? "Checkout" : "Checkout preview",
  robots: { index: false, follow: false },
};

export default function OrderPage() {
  return (
    <div className="wrap py-10">
      <p className="eyebrow mb-2">
        {CHECKOUT_LIVE ? "Checkout" : "Checkout preview"}
      </p>
      <h1 className="text-4xl md:text-5xl mb-8">Review and deliver</h1>
      <CheckoutPreview />
    </div>
  );
}
