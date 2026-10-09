import config from "@payload-config";
import Link from "next/link";
import { getPayload } from "payload";

import type { Metadata } from "next";

import {
  ConfirmationPreview,
  ClearCartOnPaid,
} from "@/components/checkout/confirmation";
import { Notice } from "@/components/lx/primitives";
import { formatNaira } from "@/lib/formatters";
import { verifyTransaction } from "@/lib/payments/paystack";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { reference, trxref } = await searchParams;
  const ref = reference ?? trxref;
  if (!ref) {
    return (
      <div className="wrap py-10">
        <ConfirmationPreview />
      </div>
    );
  }

  let state: "confirmed" | "processing" | "failed" = "failed";
  let totalKobo: number | null = null;
  let quoted = false;

  try {
    const payload = await getPayload({ config });
    const sessions = await payload.find({
      collection: "checkout-sessions",
      limit: 1,
      overrideAccess: true,
      where: { reference: { equals: ref } },
    });
    const session = sessions.docs[0];

    if (session?.status === "order-created") {
      state = "confirmed";
      totalKobo = session.grandTotalKobo;
      quoted = session.feeBasis === "manual-quote";
    } else if (session) {
      const transaction = await verifyTransaction(ref);
      if (
        transaction.status === "success" &&
        transaction.currency === "NGN" &&
        transaction.amount === session.grandTotalKobo
      ) {
        state = "processing";
        totalKobo = session.grandTotalKobo;
      }
    }
  } catch {
    // Keep payment and customer details private while showing a safe retry state.
  }

  if (state === "processing") {
    return (
      <div className="wrap py-10">
        <div className="panel p-10 max-w-xl">
          <p className="eyebrow">Payment received</p>
          <h1 className="mt-2 font-display text-4xl">
            Your order is being finalised
          </h1>
          <p className="mt-3 text-ink-2">
            Paystack confirmed {totalKobo == null ? "your payment" : formatNaira(totalKobo)}.
            We are waiting for the secure order record to finish processing.
            Refresh this page in a moment before trying another payment.
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            <Link href={`/order/confirmation?reference=${encodeURIComponent(ref)}`} className="btn btn-primary">
              Check again
            </Link>
            <Link href="/contact" className="btn btn-line">
              Contact the store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="wrap py-10">
        <div className="panel p-10 text-center max-w-xl">
          <p className="font-display text-3xl">Order not confirmed yet</p>
          <p className="mt-2 text-ink-2">
            We could not confirm a completed order for this reference. If money
            left your account, do not pay again. Check again shortly or contact
            us with your Paystack reference.
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Link href={`/order/confirmation?reference=${encodeURIComponent(ref)}`} className="btn btn-primary">
              Check again
            </Link>
            <Link href="/contact" className="btn btn-line">
              Contact the store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap py-10">
      <ClearCartOnPaid />
      <div className="max-w-3xl">
        <p className="eyebrow">Order confirmed</p>
        <h1 className="text-4xl md:text-5xl mt-1">Thank you for your order</h1>
        <p className="mt-2 text-ink-2">
          {totalKobo == null ? "Payment received" : formatNaira(totalKobo)}. Reference{" "}
          <span className="mono">{ref}</span>.
        </p>
        <Notice tone="info" className="mt-6" title="What happens next">
          {quoted
            ? "Our team will call to confirm your delivery fee before dispatch. Nothing else is charged without your agreement."
            : "Our team will confirm your delivery window on the phone number you provided. Collecting in Epe? Book your pickup on WhatsApp so your packs are ready."}
        </Notice>
        <div className="mt-6 flex gap-3 flex-wrap">
          <Link href="/contact" className="btn btn-primary">
            Contact / pickup booking
          </Link>
          <Link href="/shop" className="btn btn-line">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
