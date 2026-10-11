"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OrderSummary, useOrderTotals } from "./order-summary";

import { useCart } from "@/components/commerce/use-customer-pricing";
import { LocationPicker } from "@/components/delivery/location-picker";
import { Notice } from "@/components/lx/primitives";
import { BANK_TRANSFER, BANK_TRANSFER_ENABLED } from "@/content/business";
import { isNgPhone, previewOrderStore } from "@/features/cart/preview-order";
import { packLabel } from "@/features/catalogue/selectors";
import { MAX_RECEIPT_BYTES, prepareReceipt } from "@/lib/checkout/receipt-file";
import { formatNaira } from "@/lib/formatters";

interface Errors {
  name?: string;
  phone?: string;
  email?: string;
  street?: string;
  delivery?: string;
  cart?: string;
  payment?: string;
  payerName?: string;
  payerBank?: string;
  amountPaid?: string;
  paidAt?: string;
  receipt?: string;
}

const PAYSTACK_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_PAYSTACK === "true";
const BANK_ENABLED = BANK_TRANSFER_ENABLED && !PAYSTACK_ENABLED;
const today = () => new Date().toISOString().slice(0, 10);

export function CheckoutPreview() {
  const router = useRouter();
  const cart = useCart();
  const totals = useOrderTotals();
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [addr, setAddr] = useState({ street: "", landmark: "", notes: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [paying, setPaying] = useState(false);
  const [proof, setProof] = useState({
    payerName: "",
    payerBank: "",
    amountPaid: "",
    paidAt: today(),
    transferReference: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    globalThis.crypto.randomUUID(),
  );

  if (cart.hydrated && cart.lines.length === 0) {
    return (
      <div className="panel p-10 text-center max-w-xl mx-auto">
        <p className="font-display text-3xl">Nothing to check out</p>
        <p className="mt-2 text-ink-2">
          Add a pack first. The checkout preview needs a cart.
        </p>
        <Link href="/shop" className="btn btn-ink mt-6">
          Browse packs
        </Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Errors = {};
    if (contact.name.trim().length < 2) er.name = "Enter your full name.";
    if (!isNgPhone(contact.phone))
      er.phone =
        "Enter a Nigerian mobile number such as 0803 123 4567 or +234 803 123 4567.";
    if ((PAYSTACK_ENABLED || BANK_ENABLED) && !/^\S+@\S+\.\S+$/.test(contact.email))
      er.email = "Email is required so we can confirm your order.";
    else if (contact.email && !/^\S+@\S+\.\S+$/.test(contact.email))
      er.email = "Check the email address.";
    if (addr.street.trim().length < 4)
      er.street = "Enter the house or plot number and street.";
    if (!totals.location || !totals.option)
      er.delivery = "Confirm a delivery location and choose a delivery option.";
    if (cart.lines.some((l) => l.variant.stock.status === "out-of-stock"))
      er.cart = "Remove out of stock packs from the cart.";
    if (BANK_ENABLED) {
      if (proof.payerName.trim().length < 2)
        er.payerName = "Enter the name on the account you paid from.";
      if (proof.payerBank.trim().length < 2)
        er.payerBank = "Enter the bank you paid from.";
      if (!(Number(proof.amountPaid) > 0))
        er.amountPaid = "Enter the amount you transferred.";
      if (!proof.paidAt) er.paidAt = "Choose the date of the transfer.";
      if (!receiptFile) er.receipt = "Attach your payment receipt.";
    }
    setErrors(er);
    if (Object.keys(er).length) {
      document
        .getElementById(
          Object.keys(er)[0] === "delivery"
            ? "delivery-step"
            : ["payerName", "payerBank", "amountPaid", "paidAt", "receipt"].includes(
                  Object.keys(er)[0],
                )
              ? "payment-step"
              : "contact-step",
        )
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (PAYSTACK_ENABLED) {
      void payWithPaystack();
      return;
    }
    if (BANK_ENABLED) {
      void submitTransfer();
      return;
    }
    previewOrderStore.set({
      reference: `PREVIEW-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      createdAt: new Date().toISOString(),
      contact,
      address: {
        ...addr,
        lga: totals.resolution?.lgaName ?? null,
        state: totals.resolution?.stateName ?? null,
      },
      delivery: {
        label: totals.option!.label,
        feeKobo: totals.option!.feeKobo,
        basis: totals.option!.feeBasis,
      },
      lines: cart.lines.map((l) => ({
        label: `${l.product.name} ${packLabel(l.variant)}`,
        qty: l.qty,
        unitKobo: l.price.unitPriceKobo,
        totalKobo: l.totalKobo,
      })),
      subtotalKobo: cart.subtotalKobo,
      totalKobo: totals.totalKobo,
      access: cart.access,
    });
    router.push("/order/confirmation");
  };

  /** Sends the cart, contact and proof of payment. The server prices everything itself. */
  const submitTransfer = async () => {
    setPaying(true);
    setErrors((prev) => ({ ...prev, payment: undefined, receipt: undefined }));
    try {
      const receipt = await prepareReceipt(receiptFile!);
      if (receipt.size > MAX_RECEIPT_BYTES) {
        setErrors((prev) => ({
          ...prev,
          receipt: "That file is too large. Use a screenshot or a file under 4 MB.",
        }));
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
          fulfilment: "delivery",
          position: totals.location?.position,
          label: totals.location?.label,
          street: addr.street,
          landmark: addr.landmark,
          notes: addr.notes,
          state: totals.resolution?.stateName,
          lga: totals.resolution?.lgaName,
          idempotencyKey,
          payerName: proof.payerName,
          payerBank: proof.payerBank,
          amountPaidNaira: Number(proof.amountPaid),
          paidAt: proof.paidAt,
          transferReference: proof.transferReference,
        }),
      );
      form.set("receipt", receipt);
      const res = await fetch("/api/orders/bank-transfer", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as {
        reference?: string;
        message?: string;
      };
      if (res.ok && body.reference) {
        router.push(`/order/confirmation?transfer=${encodeURIComponent(body.reference)}`);
        return;
      }
      setErrors((prev) => ({
        ...prev,
        payment: body.message ?? "We could not save your order. Please try again.",
      }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        payment: "Upload failed. Check your connection and try again.",
      }));
    } finally {
      setPaying(false);
    }
  };

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK_TRANSFER.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the number is shown on screen */
    }
  };

  /** Server prices everything; the client only sends lines and contact. */
  const payWithPaystack = async () => {
    setPaying(true);
    setErrors((prev) => ({ ...prev, payment: undefined }));
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: cart.lines.map((l) => ({ variantId: l.variant.id, qty: l.qty })),
          email: contact.email,
          name: contact.name,
          phone: contact.phone,
          fulfilment: "delivery",
          position: totals.location?.position,
          label: totals.location?.label,
          street: addr.street,
          landmark: addr.landmark,
          notes: addr.notes,
          state: totals.resolution?.stateName,
          lga: totals.resolution?.lgaName,
          idempotencyKey,
        }),
      });
      const body = (await res.json()) as {
        authorizationUrl?: string;
        message?: string;
        whatsappFallback?: boolean;
      };
      if (res.ok && body.authorizationUrl) {
        window.location.href = body.authorizationUrl;
        return;
      }
      setErrors((prev) => ({
        ...prev,
        payment:
          body.whatsappFallback || res.status === 409
            ? "Card payment is not live on this catalogue yet — please order this cart on WhatsApp and we will confirm payment there."
            : (body.message ?? "Payment could not start. Try again."),
      }));
      setIdempotencyKey(globalThis.crypto.randomUUID());
    } catch {
      setErrors((prev) => ({
        ...prev,
        payment: "Payment could not start. Check your connection and try again.",
      }));
      setIdempotencyKey(globalThis.crypto.randomUUID());
    } finally {
      setPaying(false);
    }
  };

  const field = (
    id: keyof typeof contact | keyof typeof addr | keyof typeof proof,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    value: string,
    set: (v: string) => void,
    error?: string,
    hint?: string,
  ) => (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="field"
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="hint mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="text-sm text-danger mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_22rem]"
    >
      <div className="space-y-10">
        {!BANK_ENABLED && !PAYSTACK_ENABLED && (
          <Notice tone="sample" title="Checkout preview">
            No order is placed and no payment is taken. This shows the flow and
            the totals the backend will produce.
          </Notice>
        )}
        {errors.cart && <Notice tone="warning">{errors.cart}</Notice>}

        <section
          id="contact-step"
          aria-labelledby="s1"
          className="scroll-mt-32"
        >
          <h2 id="s1" className="text-2xl mb-4">
            <span className="mono text-ember text-base mr-2">1</span>Contact
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {field(
                "name",
                "Full name",
                { autoComplete: "name" },
                contact.name,
                (v) => setContact({ ...contact, name: v }),
                errors.name,
              )}
            </div>
            {field(
              "phone",
              "Mobile number",
              {
                autoComplete: "tel",
                inputMode: "tel",
                placeholder: "0803 123 4567",
              },
              contact.phone,
              (v) => setContact({ ...contact, phone: v }),
              errors.phone,
              "Used by the delivery team to reach you.",
            )}
            {field(
              "email",
              BANK_ENABLED || PAYSTACK_ENABLED ? "Email" : "Email (optional)",
              { autoComplete: "email", inputMode: "email", type: "email" },
              contact.email,
              (v) => setContact({ ...contact, email: v }),
              errors.email,
            )}
          </div>
        </section>

        <section
          id="delivery-step"
          aria-labelledby="s2"
          className="scroll-mt-32"
        >
          <h2 id="s2" className="text-2xl mb-4">
            <span className="mono text-ember text-base mr-2">2</span>Delivery
          </h2>
          <LocationPicker compact />
          {errors.delivery && (
            <p className="text-sm text-danger mt-3" role="alert">
              {errors.delivery}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 mt-6">
            <div className="sm:col-span-2">
              {field(
                "street",
                "House or plot number and street",
                { autoComplete: "address-line1" },
                addr.street,
                (v) => setAddr({ ...addr, street: v }),
                errors.street,
                "LGA and state come from your confirmed map location.",
              )}
            </div>
            {field(
              "landmark",
              "Nearest landmark (optional)",
              {},
              addr.landmark,
              (v) => setAddr({ ...addr, landmark: v }),
            )}
            {field("notes", "Delivery notes (optional)", {}, addr.notes, (v) =>
              setAddr({ ...addr, notes: v }),
            )}
          </div>
        </section>

        <section id="payment-step" aria-labelledby="s3" className="scroll-mt-32">
          <h2 id="s3" className="text-2xl mb-4">
            <span className="mono text-ember text-base mr-2">3</span>Payment
          </h2>
          {PAYSTACK_ENABLED ? (
            <p className="text-ink-2 max-w-prose">
              Pay securely with Paystack — cards, bank transfers and USSD.
              Totals are recomputed on the server before you are redirected,
              so the charged figure is always the catalogue figure.
            </p>
          ) : BANK_ENABLED ? (
            <div className="space-y-6 max-w-prose">
              <p className="text-ink-2">
                Pay by bank transfer, then upload your receipt below. We check
                the money has arrived and then confirm your order. Your order
                is not confirmed until we have verified the payment.
              </p>
              <div className="panel p-5 space-y-3" aria-label="Bank account details">
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  <dt className="text-ink-3">Bank</dt>
                  <dd className="font-medium">{BANK_TRANSFER.bankName}</dd>
                  <dt className="text-ink-3">Account name</dt>
                  <dd className="font-medium">{BANK_TRANSFER.accountName}</dd>
                  <dt className="text-ink-3">Account number</dt>
                  <dd className="flex items-center gap-3">
                    <span className="mono text-lg">{BANK_TRANSFER.accountNumber}</span>
                    <button type="button" className="btn btn-quiet underline underline-offset-4" onClick={copyAccount}>
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </dd>
                  <dt className="text-ink-3">Amount to pay</dt>
                  <dd className="font-medium">
                    {totals.option
                      ? formatNaira(totals.totalKobo)
                      : "Choose a delivery option to see the exact amount"}
                  </dd>
                </dl>
                <p className="hint">
                  Pay the exact amount and put your phone number as the
                  narration/remark so we can match it.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {field(
                  "payerName",
                  "Name on the account you paid from",
                  {},
                  proof.payerName,
                  (v) => setProof({ ...proof, payerName: v }),
                  errors.payerName,
                )}
                {field(
                  "payerBank",
                  "Bank you paid from",
                  {},
                  proof.payerBank,
                  (v) => setProof({ ...proof, payerBank: v }),
                  errors.payerBank,
                )}
                {field(
                  "amountPaid",
                  "Amount you transferred (₦)",
                  { inputMode: "decimal", placeholder: "0" },
                  proof.amountPaid,
                  (v) => setProof({ ...proof, amountPaid: v.replace(/[^\d.]/g, "") }),
                  errors.amountPaid,
                )}
                {field(
                  "paidAt",
                  "Date of transfer",
                  { type: "date", max: today() },
                  proof.paidAt,
                  (v) => setProof({ ...proof, paidAt: v }),
                  errors.paidAt,
                )}
                <div className="sm:col-span-2">
                  {field(
                    "transferReference",
                    "Transfer reference or session ID (optional)",
                    {},
                    proof.transferReference,
                    (v) => setProof({ ...proof, transferReference: v }),
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="receipt" className="label">
                    Payment receipt (screenshot, photo or PDF)
                  </label>
                  <input
                    id="receipt"
                    name="receipt"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="field"
                    aria-invalid={!!errors.receipt}
                    aria-describedby={errors.receipt ? "receipt-err" : undefined}
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  />
                  {errors.receipt && (
                    <p id="receipt-err" className="text-sm text-danger mt-1" role="alert">
                      {errors.receipt}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-ink-2 max-w-prose">
              Payment methods are not configured in this phase. When they are,
              they appear here and the order total below is what you are charged.
            </p>
          )}
          {errors.payment && (
            <p className="text-sm text-danger mt-3" role="alert">
              {errors.payment}
            </p>
          )}
        </section>
      </div>

      <div className="space-y-4">
        <OrderSummary />
        <button type="submit" className="btn btn-primary w-full" disabled={paying}>
          {paying
            ? BANK_ENABLED
              ? "Sending your order…"
              : "Starting secure payment…"
            : PAYSTACK_ENABLED
              ? "Pay with Paystack"
              : BANK_ENABLED
                ? "I have paid, send my receipt"
                : "Place preview order"}
        </button>
        <Link
          href="/cart"
          className="btn btn-quiet w-full underline underline-offset-4"
        >
          Back to cart
        </Link>
      </div>
    </form>
  );
}
