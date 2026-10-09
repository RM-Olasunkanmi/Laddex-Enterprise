"use client";

import Link from "next/link";

import { ApprovalTimeline } from "./status";

import { Notice, Tag } from "@/components/lx/primitives";
import { addToCart } from "@/features/cart/store";
import { packLabel } from "@/features/catalogue/selectors";
import { PERSONAS, customerStore, setPersona } from "@/features/customer/store";
import { ACCESS_LABEL, isWholesale } from "@/features/customer/types";
import { historyFor } from "@/fixtures/customers/history";
import { cartDrawer } from "@/lib/data/ui-store";
import { formatDate, formatNaira } from "@/lib/formatters";

const STATUS_TONE = {
  delivered: "success",
  "out-of-stock": "danger",
  "out-for-delivery": "info",
  processing: "warning",
} as const;

export function AccountView() {
  const profile = customerStore.use();
  const hydrated = customerStore.useHydrated();
  const access = hydrated ? profile.access : "guest";
  const history = historyFor(access);

  if (access === "guest") {
    return (
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        <div className="panel p-6">
          <h2 className="!text-2xl">Buying for the household?</h2>
          <p className="mt-2 text-ink-2">
            An account keeps past orders and your saved address. You can also
            check out as a guest.
          </p>
          <button
            className="btn btn-ink mt-5"
            onClick={() => setPersona("retail")}
          >
            Preview a retail account
          </button>
        </div>
        <div className="panel p-6">
          <h2 className="!text-2xl">Buying for a business?</h2>
          <p className="mt-2 text-ink-2">
            Register to be charged volume tiers and to repeat orders.
          </p>
          <div className="mt-5 flex gap-2 flex-wrap">
            <Link href="/wholesale/register" className="btn btn-primary">
              Register a business
            </Link>
            <button
              className="btn btn-line"
              onClick={() => setPersona("wholesale-approved")}
            >
              Preview an approved account
            </button>
          </div>
        </div>
        <Notice
          className="md:col-span-2"
          tone="sample"
          title="Sign-in is not connected yet"
        >
          These previews use sample accounts so each purchasing path can be
          reviewed. Real sign-in comes from Payload&rsquo;s users and a
          wholesale account record.
        </Notice>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <aside className="space-y-4">
        <div className="panel p-5">
          <p className="eyebrow">Account</p>
          <p className="font-display text-2xl mt-1">
            {profile.displayName ?? "Your account"}
          </p>
          <p className="mt-2">
            <Tag
              tone={
                access === "wholesale-approved"
                  ? "success"
                  : isWholesale(access)
                    ? "info"
                    : "default"
              }
            >
              {ACCESS_LABEL[access]}
            </Tag>
          </p>
          {profile.business && isWholesale(access) && (
            <div className="mt-5">
              <ApprovalTimeline status={profile.business.status} />
              {access === "wholesale-pending" && (
                <p className="text-sm text-ink-2 mt-3">
                  Applied{" "}
                  {profile.business.submittedAt
                    ? formatDate(profile.business.submittedAt)
                    : ""}
                  . List prices apply until approval. Review timing is not
                  promised.
                </p>
              )}
              {access === "wholesale-approved" && (
                <p className="text-sm text-ink-2 mt-3">
                  Volume tiers apply to your cart automatically.
                </p>
              )}
            </div>
          )}
          <button
            className="btn btn-quiet btn-sm underline underline-offset-4 mt-4"
            onClick={() => customerStore.set(PERSONAS.guest)}
          >
            Sign out (sample)
          </button>
        </div>
        {access === "wholesale-pending" && (
          <button
            className="btn btn-line btn-sm w-full"
            onClick={() => setPersona("wholesale-approved")}
          >
            Preview: staff approve this account
          </button>
        )}
      </aside>

      <section aria-labelledby="hist">
        <div className="flex items-center justify-between mb-4">
          <h2 id="hist" className="text-2xl">
            Order history
          </h2>
          <Tag tone="sample">Sample orders</Tag>
        </div>
        {history.length === 0 ? (
          <div className="panel p-8 text-center">
            <p className="font-display text-2xl">No orders yet</p>
            <p className="text-ink-2 mt-1">
              Orders placed once your account is approved appear here.
            </p>
            <Link href="/shop" className="btn btn-ink mt-4">
              Browse packs
            </Link>
          </div>
        ) : (
          <ul className="space-y-4 list-none p-0">
            {history.map((o) => (
              <li key={o.id} className="panel">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-line">
                  <div>
                    <p className="mono text-sm">{o.id}</p>
                    <p className="text-xs text-ink-3">
                      {formatDate(o.placedAt)}
                    </p>
                  </div>
                  <Tag tone={STATUS_TONE[o.status as keyof typeof STATUS_TONE]}>
                    {o.status.replace(/-/g, " ")}
                  </Tag>
                  <p className="mono font-semibold ml-auto">
                    {formatNaira(o.totalKobo)}
                  </p>
                </div>
                <ul className="px-4 py-2 text-sm divide-y divide-line list-none p-0">
                  {o.lines.map((l) => (
                    <li key={l.variantId} className="py-2 flex justify-between">
                      <span>
                        {l.qty} &times;{" "}
                        {l.variant.productId === "palm-oil"
                          ? "Palm oil"
                          : "Tapioca"}{" "}
                        {packLabel(l.variant)}
                      </span>
                      <span className="mono text-ink-3">
                        {formatNaira(l.totalKobo)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="p-4 pt-2">
                  <button
                    className="btn btn-line btn-sm min-h-11"
                    onClick={() => {
                      o.lines.forEach((l) => addToCart(l.variantId, l.qty));
                      cartDrawer.set(true);
                    }}
                  >
                    Reorder these items
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
