"use client";

import { useCart } from "@/components/commerce/use-customer-pricing";
import { packLabel } from "@/features/catalogue/selectors";
import { deliveryStore } from "@/features/delivery/store";
import { formatNaira } from "@/lib/formatters";
import { STORE, whatsappLink } from "@/lib/store";

/** Builds the WhatsApp order text from the live cart and delivery state. */
export function buildOrderMessage(
  cart: ReturnType<typeof useCart>,
  delivery: { label: string | null },
) {
  const lines = cart.lines.map(
    (l, i) =>
      `${i + 1}. ${l.product.name} ${packLabel(l.variant)} x ${l.qty} = ${formatNaira(l.totalKobo)}`,
  );
  const parts = [
    `Hello ${STORE.name}! I'd like to order:`,
    ...lines,
    `Subtotal: ${formatNaira(cart.subtotalKobo)}`,
  ];
  if (delivery.label) parts.push(`Delivery: ${delivery.label}`);
  parts.push("My name is: ");
  return parts.join("\n");
}

/**
 * Sends the current cart to the store on WhatsApp — the way Epe trade
 * actually buys. Disabled on an empty cart.
 */
export function WhatsAppOrderButton({ className = "" }: { className?: string }) {
  const cart = useCart();
  const delivery = deliveryStore.use();
  if (!cart.hydrated || cart.lines.length === 0) return null;
  const message = buildOrderMessage(cart, {
    label: delivery.location?.label ?? null,
  });
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className || "btn btn-line w-full"}
    >
      Order this cart on WhatsApp (opens in a new tab)
    </a>
  );
}
