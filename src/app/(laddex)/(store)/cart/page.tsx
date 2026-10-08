import type { Metadata } from "next";

import { CartView } from "@/components/checkout/cart-view";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="wrap py-10">
      <h1 className="text-4xl md:text-5xl mb-8">Your cart</h1>
      <CartView />
    </div>
  );
}
