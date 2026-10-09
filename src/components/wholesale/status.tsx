"use client";

import Link from "next/link";

import { Tag } from "@/components/lx/primitives";
import { customerStore } from "@/features/customer/store";

const STEPS = ["Submitted", "In review", "Approved"] as const;

/** Wholesale approval timeline, shared by the wholesale page and the account page. */
export function ApprovalTimeline({
  status,
}: {
  status: "submitted" | "in-review" | "approved";
}) {
  const idx = status === "submitted" ? 0 : status === "in-review" ? 1 : 2;
  return (
    <ol
      className="flex items-center gap-2 list-none p-0"
      aria-label="Application status"
    >
      {STEPS.map((s, i) => (
        <li
          key={s}
          className="flex items-center gap-2 flex-1 last:flex-none"
          aria-current={i === idx ? "step" : undefined}
        >
          <span
            className={`grid place-items-center w-7 h-7 rounded-full text-xs mono border ${i <= idx ? "bg-ink text-paper border-ink" : "border-line-strong text-ink-3"}`}
          >
            {i < idx || (i === idx && status === "approved") ? "✓" : i + 1}
          </span>
          <span
            className={`text-sm ${i === idx ? "font-semibold" : "text-ink-3"}`}
          >
            {s}
          </span>
          {i < STEPS.length - 1 && (
            <span
              aria-hidden="true"
              className={`h-px flex-1 ${i < idx ? "bg-ink" : "bg-line-strong"}`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

export function WholesaleStatusBanner() {
  const profile = customerStore.use();
  const hydrated = customerStore.useHydrated();
  const a = hydrated ? profile.access : "guest";
  return (
    <div className="panel p-5">
      <p className="eyebrow">Your status</p>
      {a === "wholesale-approved" && profile.business ? (
        <>
          <p className="font-display text-2xl mt-1">{profile.business.name}</p>
          <p className="mt-2">
            <Tag tone="success">Approved</Tag>
          </p>
          <p className="text-sm text-ink-2 mt-3">
            Tier prices apply to your cart.
          </p>
        </>
      ) : a === "wholesale-pending" && profile.business ? (
        <>
          <p className="font-display text-2xl mt-1">{profile.business.name}</p>
          <div className="mt-4">
            <ApprovalTimeline status={profile.business.status} />
          </div>
          <p className="text-sm text-ink-2 mt-3">
            Until approval you are charged list price.
          </p>
        </>
      ) : (
        <>
          <p className="font-display text-2xl mt-1">Not registered</p>
          <p className="text-sm text-ink-2 mt-2">
            Browsing shows indicative tiers only. List price is charged until a
            business account is approved.
          </p>
          <Link
            href="/wholesale/register"
            className="btn btn-ink btn-sm mt-4 min-h-11"
          >
            Register a business
          </Link>
        </>
      )}
    </div>
  );
}
