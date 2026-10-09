"use client";

import Link from "next/link";
import { useState } from "react";

import { useCatalogue } from "@/components/lx/catalogue-provider";
import { Notice, Tag } from "@/components/lx/primitives";
import { TierChart } from "@/components/product/tier-chart";
import { pricePerBaseUnit, tierSaving } from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";
import { customerStore } from "@/features/customer/store";
import { formatNaira, formatPercent } from "@/lib/formatters";

export function TierExplorer() {
  const { products } = useCatalogue();
  const [id, setId] = useState("po-25l");
  const profile = customerStore.use();
  const hydrated = customerStore.useHydrated();
  const access = hydrated ? profile.access : "guest";
  const all = products.flatMap((p) => p.variants.map((v) => ({ p, v })));
  const sel = all.find((x) => x.v.id === id)!;
  const unit = sel.p.baseUnit === "l" ? "L" : "kg";
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <label htmlFor="tier-pack" className="label">
          Choose a pack
        </label>
        <select
          id="tier-pack"
          className="field"
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          {products.map((p) => (
            <optgroup key={p.id} label={p.name}>
              {p.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {packLabel(v)} {v.packaging}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <dl className="mt-5 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-ink-3">List price</dt>
          <dd className="mono">
            {formatNaira(sel.v.retailPriceKobo)} per pack
          </dd>
          <dt className="text-ink-3">Minimum wholesale order</dt>
          <dd className="mono">{sel.v.wholesaleMinQty} packs</dd>
          <dt className="text-ink-3">Best tier</dt>
          <dd className="mono">
            {formatNaira(sel.v.wholesaleTiers.at(-1)!.unitPriceKobo)} (
            {formatNaira(
              pricePerBaseUnit(
                sel.v,
                sel.v.wholesaleTiers.at(-1)!.unitPriceKobo,
              ),
            )}
            /{unit})
          </dd>
          <dt className="text-ink-3">Largest saving</dt>
          <dd className="mono">
            {formatPercent(tierSaving(sel.v, sel.v.wholesaleTiers.at(-1)!), 0)}{" "}
            below list
          </dd>
        </dl>
        <Notice
          tone="info"
          className="mt-5"
          title={
            access === "wholesale-approved"
              ? "These tiers apply to your account"
              : "Indicative until your account is approved"
          }
        >
          {access === "wholesale-approved"
            ? "You are charged the tier for the quantity you order."
            : "Tier prices are shown for planning. They are charged only to approved wholesale accounts, and a written quote overrides them."}
        </Notice>
        <div className="mt-5 flex gap-2 flex-wrap">
          <Link
            href={`/wholesale/quote?pack=${sel.v.id}`}
            className="btn btn-primary"
          >
            Quote this pack
          </Link>
          <Link
            href={`/products/${sel.p.slug}?pack=${sel.v.id}`}
            className="btn btn-line"
          >
            View product
          </Link>
        </div>
      </div>
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="!text-xl">Price per pack by quantity</h3>
          <Tag tone={access === "wholesale-approved" ? "success" : "info"}>
            {access === "wholesale-approved" ? "Your pricing" : "Indicative"}
          </Tag>
        </div>
        <TierChart variant={sel.v} />
      </div>
    </div>
  );
}
