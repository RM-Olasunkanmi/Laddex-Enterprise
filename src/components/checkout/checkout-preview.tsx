"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/components/commerce/use-customer-pricing";
import { LocationPicker } from "@/components/delivery/location-picker";
import { Notice } from "@/components/lx/primitives";
import { isNgPhone, previewOrderStore } from "@/features/cart/preview-order";
import { packLabel } from "@/features/catalogue/selectors";

import { OrderSummary, useOrderTotals } from "./order-summary";

interface Errors {
  name?: string;
  phone?: string;
  email?: string;
  street?: string;
  delivery?: string;
  cart?: string;
}

export function CheckoutPreview() {
  const router = useRouter();
  const cart = useCart();
  const totals = useOrderTotals();
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [addr, setAddr] = useState({ street: "", landmark: "", notes: "" });
  const [errors, setErrors] = useState<Errors>({});

  if (cart.hydrated && cart.lines.length === 0) {
    return (
      <div className="panel p-10 text-center max-w-xl mx-auto">
        <p className="font-display text-3xl">Nothing to check out</p>
        <p className="mt-2 text-ink-2">Add a pack first. The checkout preview needs a cart.</p>
        <Link href="/shop" className="btn btn-ink mt-6">Browse packs</Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Errors = {};
    if (contact.name.trim().length < 2) er.name = "Enter your full name.";
    if (!isNgPhone(contact.phone)) er.phone = "Enter a Nigerian mobile number such as 0803 123 4567 or +234 803 123 4567.";
    if (contact.email && !/^\S+@\S+\.\S+$/.test(contact.email)) er.email = "Check the email address.";
    if (addr.street.trim().length < 4) er.street = "Enter the house or plot number and street.";
    if (!totals.location || !totals.option) er.delivery = "Confirm a delivery location and choose a delivery option.";
    if (cart.lines.some((l) => l.variant.stock.status === "out-of-stock")) er.cart = "Remove out of stock packs from the cart.";
    setErrors(er);
    if (Object.keys(er).length) {
      document.getElementById(Object.keys(er)[0] === "delivery" ? "delivery-step" : "contact-step")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    previewOrderStore.set({
      reference: `PREVIEW-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      createdAt: new Date().toISOString(),
      contact,
      address: { ...addr, lga: totals.resolution?.lgaName ?? null, state: totals.resolution?.stateName ?? null },
      delivery: { label: totals.option!.label, feeKobo: totals.option!.feeKobo, basis: totals.option!.feeBasis },
      lines: cart.lines.map((l) => ({ label: `${l.product.name} ${packLabel(l.variant)}`, qty: l.qty, unitKobo: l.price.unitPriceKobo, totalKobo: l.totalKobo })),
      subtotalKobo: cart.subtotalKobo,
      totalKobo: totals.totalKobo,
      access: cart.access,
    });
    router.push("/order/confirmation");
  };

  const field = (id: keyof typeof contact | keyof typeof addr, label: string, props: React.InputHTMLAttributes<HTMLInputElement>, value: string, set: (v: string) => void, error?: string, hint?: string) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={id} className="field" value={value} onChange={(e) => set(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} {...props} />
      {hint && !error && <p id={`${id}-hint`} className="hint mt-1">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-sm text-danger mt-1" role="alert">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-10">
        <Notice tone="sample" title="Checkout preview">No order is placed and no payment is taken. This shows the flow and the totals the backend will produce.</Notice>
        {errors.cart && <Notice tone="warning">{errors.cart}</Notice>}

        <section id="contact-step" aria-labelledby="s1" className="scroll-mt-32">
          <h2 id="s1" className="text-2xl mb-4"><span className="mono text-ember text-base mr-2">1</span>Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("name", "Full name", { autoComplete: "name" }, contact.name, (v) => setContact({ ...contact, name: v }), errors.name)}</div>
            {field("phone", "Mobile number", { autoComplete: "tel", inputMode: "tel", placeholder: "0803 123 4567" }, contact.phone, (v) => setContact({ ...contact, phone: v }), errors.phone, "Used by the delivery team to reach you.")}
            {field("email", "Email (optional)", { autoComplete: "email", inputMode: "email", type: "email" }, contact.email, (v) => setContact({ ...contact, email: v }), errors.email)}
          </div>
        </section>

        <section id="delivery-step" aria-labelledby="s2" className="scroll-mt-32">
          <h2 id="s2" className="text-2xl mb-4"><span className="mono text-ember text-base mr-2">2</span>Delivery</h2>
          <LocationPicker compact />
          {errors.delivery && <p className="text-sm text-danger mt-3" role="alert">{errors.delivery}</p>}
          <div className="grid gap-4 sm:grid-cols-2 mt-6">
            <div className="sm:col-span-2">{field("street", "House or plot number and street", { autoComplete: "address-line1" }, addr.street, (v) => setAddr({ ...addr, street: v }), errors.street, "LGA and state come from your confirmed map location.")}</div>
            {field("landmark", "Nearest landmark (optional)", {}, addr.landmark, (v) => setAddr({ ...addr, landmark: v }))}
            {field("notes", "Delivery notes (optional)", {}, addr.notes, (v) => setAddr({ ...addr, notes: v }))}
          </div>
        </section>

        <section aria-labelledby="s3">
          <h2 id="s3" className="text-2xl mb-4"><span className="mono text-ember text-base mr-2">3</span>Payment</h2>
          <p className="text-ink-2 max-w-prose">Payment methods are not configured in this phase. When they are, they appear here and the order total below is what you are charged.</p>
        </section>
      </div>

      <div className="space-y-4">
        <OrderSummary />
        <button type="submit" className="btn btn-primary w-full">Place preview order</button>
        <Link href="/cart" className="btn btn-quiet w-full underline underline-offset-4">Back to cart</Link>
      </div>
    </form>
  );
}
