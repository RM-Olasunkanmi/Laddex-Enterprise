"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { useCatalogue } from "@/components/lx/catalogue-provider";
import { Notice } from "@/components/lx/primitives";
import { isNgPhone } from "@/features/cart/preview-order";
import { activeTier } from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";
import { deliveryStore } from "@/features/delivery/store";
import { createPersistedStore } from "@/lib/data/persisted-store";
import { formatNaira } from "@/lib/formatters";

interface QuoteLine {
  variantId: string;
  qty: number;
}
interface SubmittedQuote {
  reference: string;
  business: string;
  lines: { label: string; qty: number; indicativeKobo: number }[];
  totalKobo: number;
  area: string;
}
const quoteStore = createPersistedStore<SubmittedQuote | null>("quote", null);

export function QuoteBuilder({ initialPack }: { initialPack?: string }) {
  const { products } = useCatalogue();
  const all = useMemo(
    () => products.flatMap((p) => p.variants.map((v) => ({ p, v }))),
    [products],
  );
  const first =
    all.find((x) => x.v.id === initialPack) ??
    all.find((x) => x.v.id === "gi-25kg")!;
  const [lines, setLines] = useState<QuoteLine[]>([
    { variantId: first.v.id, qty: first.v.wholesaleMinQty },
  ]);
  const [f, setF] = useState({
    business: "",
    contact: "",
    phone: "",
    area: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const loc = deliveryStore.use();
  const submitted = quoteStore.use();

  const priced = lines.map((l) => {
    const x = all.find((a) => a.v.id === l.variantId)!;
    const tier = activeTier(x.v.wholesaleTiers, l.qty);
    const unit =
      l.qty >= x.v.wholesaleMinQty && tier
        ? tier.unitPriceKobo
        : x.v.retailPriceKobo;
    return {
      ...l,
      ...x,
      unitKobo: unit,
      totalKobo: unit * l.qty,
      belowMin: l.qty < x.v.wholesaleMinQty,
    };
  });
  const total = priced.reduce((s, l) => s + l.totalKobo, 0);
  const area =
    f.area ||
    (loc.resolution?.lgaName
      ? `${loc.resolution.lgaName}, ${loc.resolution.stateName ?? "Nigeria"}`
      : "");

  if (submitted) {
    return (
      <div className="max-w-2xl">
        <Notice tone="sample" title="Quote request recorded (preview)">
          Nothing was sent. In production this creates a quote record for staff
          to price and answer in writing.
        </Notice>
        <p className="eyebrow mt-8">Reference</p>
        <h2 className="text-4xl mt-1">{submitted.reference}</h2>
        <p className="mt-2 text-ink-2">
          {submitted.business}, delivering to{" "}
          {submitted.area || "an area to be confirmed"}
        </p>
        <ul className="panel divide-y divide-line list-none p-0 mt-5">
          {submitted.lines.map((l) => (
            <li key={l.label} className="p-3 flex justify-between">
              <span>
                {l.qty} &times; {l.label}
              </span>
              <span className="mono">{formatNaira(l.indicativeKobo)}</span>
            </li>
          ))}
          <li className="p-3 flex justify-between font-semibold">
            <span>Indicative total</span>
            <span className="mono">{formatNaira(submitted.totalKobo)}</span>
          </li>
        </ul>
        <p className="hint mt-3">
          The indicative total uses sample tier prices and excludes delivery. A
          written quote supersedes it.
        </p>
        <button
          className="btn btn-line mt-6"
          onClick={() => quoteStore.set(null)}
        >
          Start another quote
        </button>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.business.trim().length < 2) er.business = "Enter the business name.";
    if (f.contact.trim().length < 2) er.contact = "Enter a contact person.";
    if (!isNgPhone(f.phone))
      er.phone = "Enter a Nigerian mobile number such as 0803 123 4567.";
    if (lines.length === 0) er.lines = "Add at least one pack.";
    setErrors(er);
    if (Object.keys(er).length) return;
    quoteStore.set({
      reference: `QUOTE-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      business: f.business,
      lines: priced.map((l) => ({
        label: `${l.p.name} ${packLabel(l.v)}`,
        qty: l.qty,
        indicativeKobo: l.totalKobo,
      })),
      totalKobo: total,
      area,
    });
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_22rem]"
    >
      <div className="space-y-8">
        <section aria-labelledby="q1">
          <h2 id="q1" className="text-2xl mb-4">
            <span className="mono text-ember text-base mr-2">1</span>What do you
            need?
          </h2>
          <ul className="space-y-3 list-none p-0">
            {priced.map((l, i) => (
              <li
                key={i}
                className="panel p-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] items-end"
              >
                <div>
                  <label className="label" htmlFor={`pack-${i}`}>
                    Pack
                  </label>
                  <select
                    id={`pack-${i}`}
                    className="field"
                    value={l.variantId}
                    onChange={(e) =>
                      setLines(
                        lines.map((x, j) =>
                          j === i
                            ? {
                                variantId: e.target.value,
                                qty: all.find((a) => a.v.id === e.target.value)!
                                  .v.wholesaleMinQty,
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    {products.map((p) => (
                      <optgroup key={p.id} label={p.name}>
                        {p.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {packLabel(v)} {v.packaging} (min{" "}
                            {v.wholesaleMinQty})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="label">Quantity</span>
                  <QuantityStepper
                    label={`Quantity of ${packLabel(l.v)}`}
                    value={l.qty}
                    min={1}
                    onChange={(n) =>
                      setLines(
                        lines.map((x, j) => (j === i ? { ...x, qty: n } : x)),
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-quiet btn-sm underline underline-offset-4 min-h-11"
                  onClick={() => setLines(lines.filter((_, j) => j !== i))}
                  disabled={lines.length === 1}
                >
                  Remove
                </button>
                {l.belowMin && (
                  <p
                    className="sm:col-span-3 text-sm text-warning"
                    role="alert"
                  >
                    Below the minimum of {l.v.wholesaleMinQty}. List price
                    applies and staff may decline a wholesale quote.
                  </p>
                )}
              </li>
            ))}
          </ul>
          {errors.lines && (
            <p role="alert" className="text-sm text-danger mt-2">
              {errors.lines}
            </p>
          )}
          <button
            type="button"
            className="btn btn-line btn-sm min-h-11 mt-3"
            onClick={() =>
              setLines([...lines, { variantId: "tp-25kg", qty: 4 }])
            }
          >
            Add another pack
          </button>
        </section>

        <section aria-labelledby="q2">
          <h2 id="q2" className="text-2xl mb-4">
            <span className="mono text-ember text-base mr-2">2</span>Your
            business
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["business", "Business name"],
                ["contact", "Contact person"],
                ["phone", "Mobile number"],
              ] as const
            ).map(([id, label]) => (
              <div
                key={id}
                className={id === "business" ? "sm:col-span-2" : ""}
              >
                <label className="label" htmlFor={`q-${id}`}>
                  {label}
                </label>
                <input
                  id={`q-${id}`}
                  className="field"
                  value={f[id]}
                  onChange={(e) => setF({ ...f, [id]: e.target.value })}
                  aria-invalid={!!errors[id]}
                  inputMode={id === "phone" ? "tel" : undefined}
                />
                {errors[id] && (
                  <p role="alert" className="text-sm text-danger mt-1">
                    {errors[id]}
                  </p>
                )}
              </div>
            ))}
            <div>
              <label className="label" htmlFor="q-area">
                Delivery area
              </label>
              <input
                id="q-area"
                className="field"
                value={f.area}
                placeholder={area || "e.g. Onitsha, Anambra"}
                onChange={(e) => setF({ ...f, area: e.target.value })}
              />
              <p className="hint mt-1">
                {loc.resolution?.lgaName ? (
                  <>
                    Using your confirmed location: {loc.resolution.lgaName}.{" "}
                    <Link href="/delivery" className="underline">
                      Change
                    </Link>
                  </>
                ) : (
                  <>
                    Or{" "}
                    <Link href="/delivery" className="underline">
                      pin it on the map
                    </Link>
                    .
                  </>
                )}
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="q-notes">
                Anything else? (optional)
              </label>
              <textarea
                id="q-notes"
                className="field min-h-24"
                value={f.notes}
                onChange={(e) => setF({ ...f, notes: e.target.value })}
              />
            </div>
          </div>
        </section>
      </div>
      <aside
        className="panel p-5 space-y-3 h-fit lg:sticky lg:top-32"
        aria-label="Indicative total"
      >
        <h2 className="!text-xl">Indicative total</h2>
        <ul className="text-sm divide-y divide-line list-none p-0">
          {priced.map((l, i) => (
            <li key={i} className="py-2 flex justify-between gap-2">
              <span>
                {l.qty} &times; {packLabel(l.v)} {l.p.name}
              </span>
              <span className="mono">{formatNaira(l.totalKobo)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between border-t border-line-strong pt-3">
          <span className="font-semibold">Total</span>
          <span className="mono text-xl font-semibold">
            {formatNaira(total)}
          </span>
        </p>
        <p className="hint">
          Uses sample tier prices, excludes delivery, and is not an offer. Staff
          confirm a quote in writing.
        </p>
        <button className="btn btn-primary w-full">Send quote request</button>
      </aside>
    </form>
  );
}
