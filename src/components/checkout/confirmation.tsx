"use client";

import Link from "next/link";

import { Price } from "@/components/commerce/money";
import { Notice } from "@/components/lx/primitives";
import { previewOrderStore } from "@/features/cart/preview-order";
import { clearCart } from "@/features/cart/store";
import { formatDate, formatNaira } from "@/lib/formatters";

export function ConfirmationPreview() {
  const order = previewOrderStore.use();
  const hydrated = previewOrderStore.useHydrated();
  if (!hydrated) return <div className="skel h-48" aria-busy="true" />;
  if (!order) {
    return (
      <div className="panel p-10 text-center max-w-xl">
        <p className="font-display text-3xl">No preview order to show</p>
        <Link href="/order" className="btn btn-ink mt-6">Go to checkout preview</Link>
      </div>
    );
  }
  return (
    <div className="max-w-3xl">
      <Notice tone="sample" title="Preview only">No order was placed and nothing was charged. This page shows what a confirmation will look like.</Notice>
      <p className="eyebrow mt-8">Reference</p>
      <h1 className="text-4xl md:text-5xl mt-1">{order.reference}</h1>
      <p className="mt-2 text-ink-2">Created {formatDate(order.createdAt)}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="panel p-5">
          <h2 className="!text-xl mb-2">Delivering to</h2>
          <p>{order.contact.name}</p>
          <p className="text-ink-2 text-sm">{order.address.street}{order.address.landmark ? `, near ${order.address.landmark}` : ""}</p>
          <p className="text-ink-2 text-sm">{[order.address.lga && `${order.address.lga} LGA`, order.address.state].filter(Boolean).join(", ")}</p>
          <p className="mono text-sm mt-2">{order.contact.phone}</p>
        </section>
        <section className="panel p-5">
          <h2 className="!text-xl mb-2">Delivery method</h2>
          <p>{order.delivery.label}</p>
          <p className="text-ink-2 text-sm">{order.delivery.feeKobo === null ? "Quote to follow in writing" : order.delivery.feeKobo === 0 ? "No charge" : `${formatNaira(order.delivery.feeKobo)} (sample rule)`}</p>
          <p className="hint mt-2">No delivery date is promised.</p>
        </section>
      </div>

      <section className="panel mt-6 overflow-hidden">
        <table className="dtable"><caption className="sr-only">Order lines</caption>
          <thead><tr><th scope="col">Item</th><th scope="col" className="!text-right">Qty</th><th scope="col" className="!text-right">Each</th><th scope="col" className="!text-right">Total</th></tr></thead>
          <tbody>{order.lines.map((l) => (<tr key={l.label}><td>{l.label}</td><td className="r">{l.qty}</td><td className="r">{formatNaira(l.unitKobo)}</td><td className="r">{formatNaira(l.totalKobo)}</td></tr>))}</tbody>
          <tfoot><tr><td colSpan={3} className="text-right text-ink-2 py-3 px-3">Total</td><td className="r py-3 px-3"><Price kobo={order.totalKobo} className="font-semibold" /></td></tr></tfoot>
        </table>
      </section>

      <div className="mt-8 flex gap-3 flex-wrap">
        <Link href="/shop" className="btn btn-ink" onClick={() => clearCart()}>Clear cart and keep shopping</Link>
        <Link href="/account" className="btn btn-line">Go to account</Link>
      </div>
    </div>
  );
}
