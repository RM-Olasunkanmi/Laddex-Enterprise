"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  AddressFields,
  EMPTY_ADDRESS,
  type AddressErrors,
  type DeliveryAddress,
} from "./address-fields";
import { BankDetails } from "./bank-transfer";

import { Price } from "@/components/commerce/money";
import { useCart } from "@/components/commerce/use-customer-pricing";
import { Notice } from "@/components/lx/primitives";
import { ProductPhoto } from "@/components/product/product-photo";
import { BANK_TRANSFER_ENABLED, BUSINESS } from "@/content/business";
import { isNgPhone, previewOrderStore } from "@/features/cart/preview-order";
import { packLabel } from "@/features/catalogue/selectors";
import { setDeliveryLocation, setDeliveryOption } from "@/features/delivery/store";
import { MAX_RECEIPT_BYTES, prepareReceipt } from "@/lib/checkout/receipt-file";
import { formatNaira } from "@/lib/formatters";
import { whatsappLink } from "@/lib/store";

/** What the server knows that the browser cannot: whether uploads and delivery fees are live. */
export interface CheckoutCapabilities {
  /** Receipt files can be stored (a storage provider is configured, or this is not serverless). */
  receiptUploads: boolean;
  /** Delivery fees come from owner-approved zones rather than sample rates. */
  deliveryRatesLive: boolean;
}

type Step = 1 | 2 | 3 | 4;
type Fulfilment = "delivery" | "pickup";
const STEPS = ["Your details", "Delivery or pickup", "Review", "Payment"] as const;
const DRAFT_KEY = "laddex-checkout-draft";
const today = () => new Date().toISOString().slice(0, 10);

interface Contact {
  name: string;
  phone: string;
  email: string;
}
interface Proof {
  payerName: string;
  payerBank: string;
  amountPaid: string;
  paidAt: string;
  transferReference: string;
}
interface Totals {
  goodsKobo: number;
  /** Null: the fee is not confirmed for this address and must be quoted. */
  deliveryKobo: number | null;
  totalKobo: number;
  /** False when the server could not be reached and these are the browser's own figures. */
  serverChecked: boolean;
}

export function CheckoutFlow({ capabilities }: { capabilities: CheckoutCapabilities }) {
  const router = useRouter();
  const cart = useCart();
  const [step, setStep] = useState<Step>(1);
  const [contact, setContact] = useState<Contact>({ name: "", phone: "", email: "" });
  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery");
  const [address, setAddress] = useState<DeliveryAddress>(EMPTY_ADDRESS);
  const [pickupNote, setPickupNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [totals, setTotals] = useState<Totals | null>(null);
  const [pricing, setPricing] = useState(false);
  const [proof, setProof] = useState<Proof>({
    payerName: "",
    payerBank: "",
    amountPaid: "",
    paidAt: today(),
    transferReference: "",
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [idempotencyKey] = useState(() => globalThis.crypto.randomUUID());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const restored = useRef(false);

  // Keep a draft for this browser tab so a refresh or a trip back to the cart loses nothing.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.contact) setContact(d.contact);
        if (d.address) setAddress({ ...EMPTY_ADDRESS, ...d.address });
        if (d.fulfilment === "pickup" || d.fulfilment === "delivery") setFulfilment(d.fulfilment);
        if (typeof d.pickupNote === "string") setPickupNote(d.pickupNote);
      }
    } catch {
      /* storage unavailable: start empty */
    }
    restored.current = true;
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ contact, address, fulfilment, pickupNote }),
      );
    } catch {
      /* ignore */
    }
  }, [contact, address, fulfilment, pickupNote]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  if (cart.hydrated && cart.lines.length === 0) {
    return (
      <div className="min-h-[36rem]">
        <div className="mx-auto max-w-xl rounded-lg border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="font-display text-3xl">Nothing to check out yet</p>
          <p className="mt-2 text-ink-2">Add a product to your cart first.</p>
          <Link href="/shop" className="btn btn-primary mt-6">
            Shop products
          </Link>
        </div>
      </div>
    );
  }
  // Same height as the first step, so the page does not jump when the cart loads.
  if (!cart.hydrated) return <div className="skel min-h-[36rem]" aria-busy="true" aria-label="Loading checkout" />;

  const outOfStock = cart.lines.some((l) => l.variant.stock.status === "out-of-stock");
  const canTakeTransfer = BANK_TRANSFER_ENABLED && capabilities.receiptUploads;

  const focusFirstError = () =>
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
    );

  // ---- Step 1 -------------------------------------------------------------------------------
  const emailRequired = canTakeTransfer;
  const validateContact = () => {
    const er: Record<string, string> = {};
    if (contact.name.trim().length < 2) er.name = "Enter your full name.";
    if (!isNgPhone(contact.phone))
      er.phone = "Enter a Nigerian mobile number, for example 0803 123 4567.";
    const email = contact.email.trim();
    if (emailRequired && !email) er.email = "Enter your email so we can send your order confirmation.";
    else if (email && !/^\S+@\S+\.\S+$/.test(email)) er.email = "Check the email address.";
    return er;
  };

  // ---- Step 2 -------------------------------------------------------------------------------
  const validateFulfilment = () => {
    const er: AddressErrors = {};
    if (fulfilment === "delivery") {
      if (!address.stateId) er.state = "Choose your state.";
      if (!address.lgaId && address.precision !== "gps" && address.precision !== "map-pin")
        er.lga = "Choose your local government area.";
      if (address.street.trim().length < 4) er.street = "Enter the house number and street.";
      if (!address.position && !er.state && !er.lga) er.lga = "Choose your local government area.";
    }
    return er as Record<string, string>;
  };

  /** Server totals: catalogue prices and the delivery rule for this exact address. */
  const priceOrder = async () => {
    setPricing(true);
    const fallback: Totals = {
      goodsKobo: cart.subtotalKobo,
      deliveryKobo: fulfilment === "pickup" ? 0 : null,
      totalKobo: cart.subtotalKobo,
      serverChecked: false,
    };
    // Never leave the customer waiting on a slow network: fall back after 10 seconds.
    const ctl = new AbortController();
    const timer = window.setTimeout(() => ctl.abort(), 10_000);
    try {
      const res = await fetch("/api/checkout/prepare", {
        signal: ctl.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: cart.lines.map((l) => ({ variantId: l.variant.id, qty: l.qty })),
          fulfilment,
          position: fulfilment === "delivery" ? address.position : undefined,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const b = (await res.json()) as {
        goodsKobo: number;
        totalKobo: number;
        delivery: { feeKobo: number | null };
      };
      setTotals({
        goodsKobo: b.goodsKobo,
        deliveryKobo: b.delivery.feeKobo,
        totalKobo: b.totalKobo,
        serverChecked: true,
      });
    } catch {
      setTotals(fallback);
    } finally {
      window.clearTimeout(timer);
      setPricing(false);
    }
  };

  const next = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      const er = validateContact();
      setErrors(er);
      if (Object.keys(er).length) return focusFirstError();
      setStep(2);
      return;
    }
    if (step === 2) {
      const er = validateFulfilment();
      setErrors(er);
      if (Object.keys(er).length) return focusFirstError();
      if (fulfilment === "delivery" && address.position) {
        // Share the confirmed address with the delivery page and quote builder.
        setDeliveryLocation(
          {
            position: address.position,
            label: [address.lgaName, address.stateName].filter(Boolean).join(", "),
            addressLine: [address.street, address.landmark].filter(Boolean).join(", "),
            source: address.precision === "gps" ? "gps" : address.precision === "map-pin" ? "map-pin" : "search",
            precision: address.precision === "gps" ? "gps" : address.precision === "map-pin" ? "map-pin" : "locality-centroid",
            confirmed: true,
          },
          null,
        );
        setDeliveryOption("home");
      }
      setTotals(null);
      setStep(3);
      void priceOrder();
      return;
    }
    if (step === 3) {
      if (outOfStock) return;
      setStep(4);
      if (totals && !proof.amountPaid)
        setProof((p) => ({ ...p, amountPaid: String(Math.round(totals.totalKobo / 100)) }));
    }
  };

  // ---- Step 4 -------------------------------------------------------------------------------
  const feePending = fulfilment === "delivery" && (!totals || totals.deliveryKobo === null);
  const mode: "transfer" | "whatsapp" | "preview" = !BANK_TRANSFER_ENABLED
    ? "preview"
    : canTakeTransfer && !feePending
      ? "transfer"
      : "whatsapp";

  const orderText = () =>
    [
      `Hello ${BUSINESS.name}, I would like to place this order.`,
      ...cart.lines.map(
        (l, i) => `${i + 1}. ${l.product.name} ${packLabel(l.variant)} x ${l.qty} = ${formatNaira(l.totalKobo)}`,
      ),
      `Goods: ${formatNaira(totals?.goodsKobo ?? cart.subtotalKobo)}`,
      fulfilment === "pickup"
        ? `Pickup at your Epe store${pickupNote.trim() ? ` (${pickupNote.trim()})` : ""}`
        : `Deliver to: ${address.street}${address.landmark ? ` (landmark: ${address.landmark})` : ""}, ${address.lgaName}, ${address.stateName}${address.notes ? `. Notes: ${address.notes}` : ""}`,
      fulfilment === "delivery" ? "Please confirm the delivery fee and the total to pay." : "",
      `Name: ${contact.name}`,
      `Phone: ${contact.phone}`,
      contact.email ? `Email: ${contact.email}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (proof.payerName.trim().length < 2) er.payerName = "Enter the name on the account you paid from.";
    if (proof.payerBank.trim().length < 2) er.payerBank = "Enter the bank you paid from.";
    if (!(Number(proof.amountPaid) > 0)) er.amountPaid = "Enter the amount you transferred.";
    if (!proof.paidAt) er.paidAt = "Choose the date of the transfer.";
    if (!receipt) er.receipt = "Attach a screenshot, photo or PDF of your receipt.";
    setErrors(er);
    if (Object.keys(er).length) return focusFirstError();
    setSending(true);
    try {
      const file = await prepareReceipt(receipt!);
      if (file.size > MAX_RECEIPT_BYTES) {
        setErrors({ receipt: "That file is over 4 MB. Use a screenshot instead." });
        return;
      }
      const form = new FormData();
      form.set(
        "data",
        JSON.stringify({
          lines: cart.lines.map((l) => ({ variantId: l.variant.id, qty: l.qty })),
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          fulfilment,
          position: fulfilment === "delivery" ? address.position : undefined,
          label: fulfilment === "delivery" ? [address.lgaName, address.stateName].filter(Boolean).join(", ") : "Pickup in Epe",
          street: fulfilment === "delivery" ? address.street : "",
          landmark: fulfilment === "delivery" ? address.landmark : "",
          notes: fulfilment === "delivery" ? address.notes : pickupNote,
          state: fulfilment === "delivery" ? address.stateName : undefined,
          lga: fulfilment === "delivery" ? address.lgaName : undefined,
          idempotencyKey,
          payerName: proof.payerName,
          payerBank: proof.payerBank,
          amountPaidNaira: Number(proof.amountPaid),
          paidAt: proof.paidAt,
          transferReference: proof.transferReference,
        }),
      );
      form.set("receipt", file);
      const res = await fetch("/api/orders/bank-transfer", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as {
        reference?: string;
        message?: string;
        whatsappFallback?: boolean;
      };
      if (res.ok && body.reference) {
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        router.push(`/order/confirmation?transfer=${encodeURIComponent(body.reference)}`);
        return;
      }
      setErrors({
        ...(body.whatsappFallback || res.status >= 500 ? { fallback: "1" } : {}),
        payment:
          body.message ??
          "We could not save your order. If you have already paid, send your receipt to us on WhatsApp and we will check it.",
      });
    } catch {
      setErrors({
        payment: "The upload did not go through. Check your connection and try again. Please do not pay twice.",
      });
    } finally {
      setSending(false);
    }
  };

  const placePreview = () => {
    previewOrderStore.set({
      reference: `PREVIEW-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      createdAt: new Date().toISOString(),
      contact,
      address: {
        street: fulfilment === "pickup" ? "Pickup at the Epe store" : address.street,
        landmark: address.landmark,
        notes: fulfilment === "pickup" ? pickupNote : address.notes,
        lga: fulfilment === "pickup" ? null : address.lgaName,
        state: fulfilment === "pickup" ? null : address.stateName,
      },
      delivery: {
        label: fulfilment === "pickup" ? "Pickup in Epe" : "Delivery to your address",
        feeKobo: totals?.deliveryKobo ?? null,
        basis: totals?.deliveryKobo === null ? "quote-required" : "region-rule",
      },
      lines: cart.lines.map((l) => ({
        label: `${l.product.name} ${packLabel(l.variant)}`,
        qty: l.qty,
        unitKobo: l.price.unitPriceKobo,
        totalKobo: l.totalKobo,
      })),
      subtotalKobo: totals?.goodsKobo ?? cart.subtotalKobo,
      totalKobo: totals?.totalKobo ?? cart.subtotalKobo,
      access: cart.access,
    });
    router.push("/order/confirmation");
  };

  // ---- Shared bits ---------------------------------------------------------------------------
  const input = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    hint?: string,
  ) => (
    <div>
      <label htmlFor={`co-${id}`} className="label">
        {label}
      </label>
      <input
        id={`co-${id}`}
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!errors[id] || undefined}
        aria-describedby={errors[id] ? `co-${id}-err` : hint ? `co-${id}-hint` : undefined}
        {...props}
      />
      {errors[id] ? (
        <p id={`co-${id}-err`} className="mt-1 text-sm text-danger">
          {errors[id]}
        </p>
      ) : (
        hint && (
          <p id={`co-${id}-hint`} className="hint mt-1">
            {hint}
          </p>
        )
      )}
    </div>
  );

  const goodsKobo = totals?.goodsKobo ?? cart.subtotalKobo;
  const itemCount = cart.lines.reduce((n, l) => n + l.qty, 0);
  const deliveryLine =
    fulfilment === "pickup"
      ? "No charge (pickup)"
      : step < 3 || !totals
        ? "Worked out next"
        : totals.deliveryKobo === null
          ? "Pending confirmation"
          : formatNaira(totals.deliveryKobo);
  const totalKobo = goodsKobo + (fulfilment === "pickup" ? 0 : (totals?.deliveryKobo ?? 0));

  const summary = (
    <div className="rounded-lg border border-line bg-card">
      <ul className="divide-y divide-line px-5">
        {cart.lines.map((l) => (
          <li key={l.variant.id} className="flex items-center gap-3 py-3">
            <ProductPhoto product={l.product} sizes="48px" className="h-12 w-12 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium">{l.product.name}</p>
              <p className="text-ink-3">
                {packLabel(l.variant)} &times; {l.qty}
              </p>
            </div>
            <Price kobo={l.totalKobo} className="text-sm font-medium" />
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-2">Goods</dt>
          <dd>
            <Price kobo={goodsKobo} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Delivery</dt>
          <dd className={`text-right ${deliveryLine === "Pending confirmation" ? "font-medium text-warning" : ""}`}>
            {deliveryLine}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-semibold">
            Total
            {fulfilment === "delivery" && (step < 3 || totals?.deliveryKobo === null) && (
              <span className="block text-xs font-normal text-ink-3">before delivery</span>
            )}
          </dt>
          <dd>
            <Price kobo={totalKobo} className="text-xl font-semibold" />
          </dd>
        </div>
      </dl>
    </div>
  );

  return (
    <div className="grid min-h-[36rem] gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="min-w-0 lg:col-span-7 xl:col-span-8">
        {/* Progress */}
        <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Checkout progress">
          {STEPS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = n < step;
            const current = n === step;
            return (
              <li key={label} className="min-w-0">
                <button
                  type="button"
                  disabled={!done}
                  onClick={() => done && setStep(n)}
                  aria-current={current ? "step" : undefined}
                  className="group block w-full text-left disabled:cursor-default"
                >
                  <span
                    className={`block h-1 rounded-full transition-colors duration-[var(--d-slow)] ${n <= step ? "bg-forest" : "bg-line"}`}
                  />
                  <span className={`mt-2 block truncate text-xs sm:text-sm ${current ? "font-semibold text-ink" : done ? "text-forest group-hover:underline" : "text-ink-3"}`}>
                    <span className="num">{n}.</span> {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Mobile summary */}
        <details className="mb-8 rounded-lg border border-line bg-card lg:hidden">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-5 py-3">
            <span className="font-medium">
              Order summary{" "}
              <span className="text-sm font-normal text-ink-3">
                ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
            </span>
            <Price kobo={totalKobo} className="font-semibold" />
          </summary>
          <div className="border-t border-line">{summary}</div>
        </details>

        {outOfStock && (
          <Notice tone="warning" className="mb-6" title="Something in your cart is out of stock">
            <Link href="/cart" className="underline underline-offset-4">
              Go back to your cart
            </Link>{" "}
            and remove it to continue.
          </Notice>
        )}

        <div key={step} className="page-in">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="scroll-mt-28 text-3xl outline-none"
          >
            {STEPS[step - 1]}
          </h2>

          {step === 1 && (
            <form onSubmit={next} noValidate className="mt-6 space-y-5">
              {input("name", "Full name", contact.name, (v) => setContact({ ...contact, name: v }), { autoComplete: "name" })}
              <div className="grid gap-5 sm:grid-cols-2">
                {input(
                  "phone",
                  "Mobile number",
                  contact.phone,
                  (v) => setContact({ ...contact, phone: v }),
                  { autoComplete: "tel", inputMode: "tel", type: "tel", placeholder: "0803 123 4567" },
                  "We call or WhatsApp this number about your order.",
                )}
                {input(
                  "email",
                  emailRequired ? "Email" : "Email (optional)",
                  contact.email,
                  (v) => setContact({ ...contact, email: v }),
                  { autoComplete: "email", inputMode: "email", type: "email" },
                  "For your order confirmation.",
                )}
              </div>
              <StepActions primary="Continue to delivery" back={{ href: "/cart", label: "Back to cart" }} />
            </form>
          )}

          {step === 2 && (
            <form onSubmit={next} noValidate className="mt-6 space-y-6">
              <fieldset>
                <legend className="sr-only">How do you want to receive your order?</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["delivery", "Deliver to me", "Anywhere in Nigeria. The fee depends on your area and order weight."],
                      ["pickup", "Pick up in Epe", `No delivery charge. ${BUSINESS.hours.split(",")[0]}, by appointment.`],
                    ] as const
                  ).map(([id, title, body]) => (
                    <label key={id} className="block">
                      <input
                        type="radio"
                        name="fulfilment"
                        value={id}
                        checked={fulfilment === id}
                        onChange={() => {
                          setFulfilment(id);
                          setErrors({});
                        }}
                        className="peer sr-only"
                      />
                      <span className="block h-full rounded-lg border border-line-strong bg-card p-4 transition-colors peer-checked:border-forest peer-checked:bg-forest-tint peer-checked:shadow-[inset_0_0_0_1px_var(--color-forest)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest">
                        <span className="block font-semibold">{title}</span>
                        <span className="mt-1 block text-sm text-ink-2">{body}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {fulfilment === "delivery" ? (
                <>
                  <AddressFields
                    value={address}
                    onChange={(a) => {
                      setAddress(a);
                      if (Object.keys(errors).length) setErrors({});
                    }}
                    errors={errors as AddressErrors}
                  />
                  {!capabilities.deliveryRatesLive && (
                    <Notice tone="info">
                      Delivery fees are being confirmed for each area. If we
                      cannot show your fee yet, you can send the order to us
                      and we will reply with the total before you pay.
                    </Notice>
                  )}
                </>
              ) : (
                <div className="space-y-4 rounded-lg border border-line bg-card p-5">
                  <div>
                    <p className="font-semibold">Laddex Enterprise store</p>
                    <address className="mt-1 text-sm not-italic text-ink-2">
                      {BUSINESS.address}
                      <br />
                      {BUSINESS.hours}
                    </address>
                  </div>
                  <div>
                    <label htmlFor="co-pickup" className="label">
                      When would you like to collect?{" "}
                      <span className="font-normal text-ink-3">(optional)</span>
                    </label>
                    <input
                      id="co-pickup"
                      className="field"
                      value={pickupNote}
                      onChange={(e) => setPickupNote(e.target.value)}
                      placeholder="e.g. Saturday morning"
                    />
                    <p className="hint mt-1">We confirm the time with you before you come.</p>
                  </div>
                </div>
              )}
              <StepActions primary="Review order" onBack={() => setStep(1)} />
            </form>
          )}

          {step === 3 && (
            <form onSubmit={next} noValidate className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewBlock title="Contact" onEdit={() => setStep(1)}>
                  <p>{contact.name}</p>
                  <p className="text-ink-2">{contact.phone}</p>
                  {contact.email && <p className="text-ink-2">{contact.email}</p>}
                </ReviewBlock>
                <ReviewBlock title={fulfilment === "pickup" ? "Pickup" : "Delivery address"} onEdit={() => setStep(2)}>
                  {fulfilment === "pickup" ? (
                    <>
                      <p>Collect from our Epe store</p>
                      <p className="text-ink-2">{pickupNote || "Time to be agreed"}</p>
                    </>
                  ) : (
                    <>
                      <p>{address.street}</p>
                      {address.landmark && <p className="text-ink-2">Landmark: {address.landmark}</p>}
                      <p className="text-ink-2">
                        {[address.lgaName, address.stateName].filter(Boolean).join(", ")}
                      </p>
                    </>
                  )}
                </ReviewBlock>
              </div>

              <div className="lg:hidden">{summary}</div>

              <div aria-live="polite">
                {pricing ? (
                  <p className="text-sm text-ink-2" role="status">
                    Checking prices and delivery for your address…
                  </p>
                ) : totals && fulfilment === "delivery" && totals.deliveryKobo === null ? (
                  <Notice tone="warning" title="Delivery fee pending confirmation">
                    We do not have a confirmed fee for {address.lgaName || address.stateName} yet.
                    Continue and send us the order: we reply with the delivery
                    fee and the total before you pay anything. Or{" "}
                    <button
                      type="button"
                      className="underline underline-offset-4"
                      onClick={() => {
                        setFulfilment("pickup");
                        setStep(2);
                      }}
                    >
                      choose pickup in Epe
                    </button>
                    .
                  </Notice>
                ) : totals && !totals.serverChecked ? (
                  <p className="hint">
                    Totals are checked again by our system when you submit.
                  </p>
                ) : null}
                {totals?.serverChecked && totals.goodsKobo !== cart.subtotalKobo && (
                  <Notice tone="warning" className="mt-3" title="Prices have changed">
                    The current price of your goods is {formatNaira(totals.goodsKobo)}. That is the amount used below.
                  </Notice>
                )}
              </div>
              <StepActions
                primary="Continue to payment"
                disabled={pricing || outOfStock}
                onBack={() => setStep(2)}
              />
            </form>
          )}

          {step === 4 && mode === "transfer" && totals && (
            <form onSubmit={submitTransfer} noValidate className="mt-6 space-y-8">
              <ol className="space-y-2 text-[0.9375rem] text-ink-2">
                <li>
                  <span className="num mr-2 font-semibold text-forest">1</span>
                  Transfer the exact amount below from your banking app. Use your phone number as the narration.
                </li>
                <li>
                  <span className="num mr-2 font-semibold text-forest">2</span>
                  Upload the receipt or a screenshot of the transfer.
                </li>
                <li>
                  <span className="num mr-2 font-semibold text-forest">3</span>
                  We check that the money has arrived, then confirm your order by phone or WhatsApp.
                </li>
              </ol>
              <BankDetails totalKobo={totals.totalKobo} />

              <fieldset className="space-y-5">
                <legend className="text-xl font-display">Your transfer</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  {input("payerName", "Name on the account you paid from", proof.payerName, (v) => setProof({ ...proof, payerName: v }), { autoComplete: "name" })}
                  {input("payerBank", "Bank you paid from", proof.payerBank, (v) => setProof({ ...proof, payerBank: v }))}
                  {input(
                    "amountPaid",
                    "Amount you transferred (₦)",
                    proof.amountPaid,
                    (v) => setProof({ ...proof, amountPaid: v.replace(/[^\d.]/g, "") }),
                    { inputMode: "decimal" },
                  )}
                  {input("paidAt", "Date of transfer", proof.paidAt, (v) => setProof({ ...proof, paidAt: v }), { type: "date", max: today() })}
                </div>
                {input(
                  "transferReference",
                  "Transfer reference or session ID (optional)",
                  proof.transferReference,
                  (v) => setProof({ ...proof, transferReference: v }),
                )}
                <div>
                  <label htmlFor="co-receipt" className="label">
                    Payment receipt
                  </label>
                  <label
                    htmlFor="co-receipt"
                    className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-4 text-center text-sm ${errors.receipt ? "border-danger" : receipt ? "border-forest bg-forest-tint/50" : "border-line-strong bg-card hover:border-ink-3"}`}
                  >
                    {receipt ? (
                      <>
                        <span className="font-semibold">{receipt.name}</span>
                        <span className="text-ink-3">
                          {receipt.size < 1024 * 1024
                            ? `${Math.max(1, Math.round(receipt.size / 1024))} KB`
                            : `${(receipt.size / 1024 / 1024).toFixed(1)} MB`}{" "}
                          &middot; tap to change
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">Choose a screenshot, photo or PDF</span>
                        <span className="text-ink-3">JPG, PNG, WebP or PDF. Large photos are reduced for you.</span>
                      </>
                    )}
                  </label>
                  <input
                    id="co-receipt"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    aria-invalid={!!errors.receipt || undefined}
                    aria-describedby={errors.receipt ? "co-receipt-err" : undefined}
                    onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                  />
                  {errors.receipt && (
                    <p id="co-receipt-err" className="mt-1 text-sm text-danger">
                      {errors.receipt}
                    </p>
                  )}
                </div>
              </fieldset>
              <Notice>
                Sending a receipt does not confirm the order. We confirm it once
                we see the payment in our account.
              </Notice>
              {errors.payment && (
                <div className="space-y-3 rounded-md bg-danger-tint px-4 py-3 text-sm text-danger" role="alert">
                  <p>{errors.payment}</p>
                  {errors.fallback && (
                    <a
                      href={whatsappLink(`${orderText()}
I have already paid and will send my receipt here.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm min-h-11"
                    >
                      Send order and receipt on WhatsApp
                      <span className="sr-only"> (opens WhatsApp)</span>
                    </a>
                  )}
                </div>
              )}
              <StepActions
                primary={sending ? "Sending your receipt…" : "I have paid, send my receipt"}
                disabled={sending}
                onBack={() => setStep(3)}
              />
            </form>
          )}

          {step === 4 && mode === "whatsapp" && (
            <div className="mt-6 space-y-6">
              <p className="max-w-prose text-ink-2">
                {feePending
                  ? "Please do not pay yet. Send your order to us on WhatsApp. We reply with the delivery fee, the total and our account details."
                  : "Please do not pay yet. Send your order to us on WhatsApp and we will reply with the total and our account details."}
              </p>
              <div className="rounded-lg border border-line bg-card p-5">
                <p className="text-sm font-semibold">Your message</p>
                <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap font-sans text-sm text-ink-2">
                  {orderText()}
                </pre>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappLink(orderText())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg"
                >
                  Send order on WhatsApp
                  <span className="sr-only"> (opens WhatsApp)</span>
                </a>
                <button type="button" className="btn btn-quiet" onClick={() => setStep(3)}>
                  Back to review
                </button>
              </div>
            </div>
          )}

          {step === 4 && mode === "preview" && (
            <div className="mt-6 space-y-6">
              <Notice tone="sample" title="Checkout preview">
                Online payment is not switched on for this site, so no order is
                placed and nothing is charged. You can send the order on
                WhatsApp instead.
              </Notice>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappLink(orderText())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg"
                >
                  Send order on WhatsApp
                  <span className="sr-only"> (opens WhatsApp)</span>
                </a>
                <button type="button" className="btn btn-line btn-lg" onClick={placePreview}>
                  Place preview order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="hidden lg:col-span-5 lg:block xl:col-span-4" aria-label="Order summary">
        <div className="sticky top-28">
          <h2 className="mb-3 text-xl">Order summary</h2>
          {summary}
          <p className="hint mt-3">
            Prices are checked again by our system before your order is saved.
          </p>
        </div>
      </aside>
    </div>
  );
}

function StepActions({
  primary,
  disabled,
  onBack,
  back,
}: {
  primary: string;
  disabled?: boolean;
  onBack?: () => void;
  back?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <button type="button" className="btn btn-quiet" onClick={onBack}>
          &larr; Back
        </button>
      ) : back ? (
        <Link href={back.href} className="btn btn-quiet">
          &larr; {back.label}
        </Link>
      ) : (
        <span />
      )}
      <button type="submit" className="btn btn-primary btn-lg" disabled={disabled}>
        {primary}
      </button>
    </div>
  );
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-card p-4 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
          {title}
        </h3>
        <button type="button" onClick={onEdit} className="min-h-9 px-1 text-sm text-forest underline underline-offset-4">
          Change<span className="sr-only"> {title.toLowerCase()}</span>
        </button>
      </div>
      {children}
    </section>
  );
}
