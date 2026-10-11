"use client";

import { useState } from "react";

import { BANK_TRANSFER } from "@/content/business";
import { formatNaira } from "@/lib/formatters";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  return (
    <button
      type="button"
      className="btn btn-line btn-sm min-h-10 shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("done");
        } catch {
          setState("failed");
        }
        window.setTimeout(() => setState("idle"), 2000);
      }}
      aria-label={`Copy ${label}`}
    >
      {state === "done" ? "Copied" : state === "failed" ? "Copy it by hand" : "Copy"}
      <span className="sr-only" role="status">
        {state === "done" ? `${label} copied` : ""}
      </span>
    </button>
  );
}

/** Account details for the transfer. Values come from public env vars set by the business. */
export function BankDetails({ totalKobo }: { totalKobo: number }) {
  const naira = (totalKobo / 100).toFixed(0);
  return (
    <div className="overflow-hidden rounded-lg border border-forest/30 bg-card">
      <div className="bg-forest px-5 py-3 text-on-forest">
        <p className="text-sm font-semibold">Transfer exactly</p>
        <p className="num font-display text-3xl font-semibold">
          {formatNaira(totalKobo)}
        </p>
      </div>
      <dl className="divide-y divide-line">
        {[
          { label: "Bank", value: BANK_TRANSFER.bankName, copy: false },
          { label: "Account name", value: BANK_TRANSFER.accountName, copy: false },
          { label: "Account number", value: BANK_TRANSFER.accountNumber, copy: true },
          { label: "Amount", value: naira, copy: true },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <dt className="text-xs text-ink-3">{row.label}</dt>
              <dd
                className={`break-words font-semibold ${row.label === "Account number" ? "num text-xl tracking-wider" : ""}`}
              >
                {row.label === "Amount" ? formatNaira(totalKobo) : row.value}
              </dd>
            </div>
            {row.copy && <CopyButton text={row.value} label={row.label.toLowerCase()} />}
          </div>
        ))}
      </dl>
    </div>
  );
}
