import type { Metadata } from "next";

import { CheckoutPreview } from "@/components/checkout/checkout-preview";

export const metadata: Metadata = { title: "Checkout preview" };

export default function OrderPage() {
  return (
    <div className="wrap py-10">
      <p className="eyebrow mb-2">Checkout preview</p>
      <h1 className="text-4xl md:text-5xl mb-8">Review and deliver</h1>
      <CheckoutPreview />
    </div>
  );
}
