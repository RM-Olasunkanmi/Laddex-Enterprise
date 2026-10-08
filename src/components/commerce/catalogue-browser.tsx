"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useCatalogue } from "@/components/lx/catalogue-provider";
import { applyQuery, availableSizes, normaliseQuery, sortOptions, toListings, type CatalogueQuery, type SortKey } from "@/features/catalogue/selectors";
import type { CategoryId, SalesFormat } from "@/features/catalogue/types";

import { ProductCard } from "./product-card";

function parse(params: URLSearchParams, category: CategoryId | "all"): CatalogueQuery {
  const format = params.get("format");
  return {
    category,
    format: format === "packaged" || format === "bulk" ? format : "all",
    inStockOnly: params.get("stock") === "1",
    sizes: params.get("size")?.split("|").filter(Boolean) ?? [],
    sort: (params.get("sort") as SortKey) || "featured",
  };
}

export function CatalogueBrowser({ category }: { category: CategoryId | "all" }) {
  const { products, categories } = useCatalogue();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const query = useMemo(() => normaliseQuery(parse(new URLSearchParams(params.toString()), category), products), [params, category, products]);
  const listings = useMemo(() => toListings(products), [products]);
  const results = useMemo(() => applyQuery(listings, query, products), [listings, query, products]);
  const sizes = availableSizes(products, category);
  const sorts = sortOptions(category);

  const update = (patch: Partial<CatalogueQuery>) => {
    const next = { ...query, ...patch };
    const sp = new URLSearchParams();
    if (next.format !== "all") sp.set("format", next.format);
    if (next.inStockOnly) sp.set("stock", "1");
    if (next.sizes.length) sp.set("size", next.sizes.join("|"));
    if (next.sort !== "featured") sp.set("sort", next.sort);
    router.replace(sp.size ? `${pathname}?${sp}` : pathname, { scroll: false });
  };
  const activeCount = (query.format !== "all" ? 1 : 0) + (query.inStockOnly ? 1 : 0) + query.sizes.length;
  const clear = () => router.replace(pathname, { scroll: false });
  const tabs: { href: string; label: string; active: boolean }[] = [
    { href: "/shop", label: "All packs", active: category === "all" },
    ...categories.map((c) => ({ href: `/shop/${c.id}`, label: c.name, active: category === c.id })),
  ];
  const info = categories.find((c) => c.id === category);

  return (
    <div className="wrap py-10">
      <header className="max-w-2xl">
        <p className="eyebrow mb-3">{info ? info.tagline : "Palm oil and tapioca"}</p>
        <h1 className="text-4xl md:text-5xl">{info ? info.name : "All packs"}</h1>
        <p className="mt-3 text-ink-2">{info ? info.blurb : "Every pack size in one list. Pick a category to compare price per litre or per kilo and filter by pack size."}</p>
      </header>

      <nav aria-label="Category" className="mt-8 flex gap-1 border-b border-line overflow-x-auto">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} aria-current={t.active ? "page" : undefined} className={`px-4 min-h-11 grid place-items-center whitespace-nowrap border-b-2 -mb-px ${t.active ? "border-ember font-semibold" : "border-transparent text-ink-2 hover:text-ink"}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside aria-label="Filters">
          <button type="button" className="lg:hidden btn btn-line w-full justify-between" aria-expanded={open} aria-controls="filters" onClick={() => setOpen((o) => !o)}>
            <span>Filters{activeCount ? ` (${activeCount})` : ""}</span>
            <span aria-hidden="true">{open ? "−" : "+"}</span>
          </button>
          <div id="filters" className={`${open ? "block" : "hidden"} lg:block mt-3 lg:mt-0 space-y-6`}>
            <fieldset>
              <legend className="label">Sales format</legend>
              {(["all", "packaged", "bulk"] as const).map((f) => (
                <label key={f} className="flex items-center gap-3 min-h-11 cursor-pointer">
                  <input type="radio" name="format" className="accent-ember w-4 h-4" checked={query.format === f} onChange={() => update({ format: f as SalesFormat | "all" })} />
                  <span>{f === "all" ? "All formats" : f === "packaged" ? "Packaged (household)" : "Bulk (trade volumes)"}</span>
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend className="label">Availability</legend>
              <label className="flex items-center gap-3 min-h-11 cursor-pointer">
                <input type="checkbox" className="accent-ember w-4 h-4" checked={query.inStockOnly} onChange={(e) => update({ inStockOnly: e.target.checked })} />
                <span>Hide out of stock</span>
              </label>
            </fieldset>
            {sizes.length > 0 && (
              <fieldset>
                <legend className="label">Pack size</legend>
                {sizes.map((s) => (
                  <label key={s} className="flex items-center gap-3 min-h-11 cursor-pointer">
                    <input type="checkbox" className="accent-ember w-4 h-4" checked={query.sizes.includes(s)} onChange={(e) => update({ sizes: e.target.checked ? [...query.sizes, s] : query.sizes.filter((x) => x !== s) })} />
                    <span className="mono">{s}</span>
                  </label>
                ))}
              </fieldset>
            )}
            {activeCount > 0 && (
              <button type="button" className="btn btn-quiet btn-sm underline underline-offset-4" onClick={clear}>
                Clear filters
              </button>
            )}
          </div>
        </aside>

        <section aria-label="Results">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <p role="status" aria-live="polite" className="text-ink-2">
              <span className="mono text-ink">{results.length}</span> {results.length === 1 ? "pack" : "packs"}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink-2">Sort</span>
              <select className="field !min-h-10 !w-auto" value={query.sort} onChange={(e) => update({ sort: e.target.value as SortKey })}>
                {sorts.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {results.length === 0 ? (
            <div className="panel p-10 text-center">
              <p className="font-display text-2xl">No packs match these filters</p>
              <p className="mt-2 text-ink-2">Try a different size or show out of stock packs again.</p>
              <button className="btn btn-ink mt-5" onClick={clear}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map(({ product, variant }, i) => (
                <ProductCard key={variant.id} product={product} variant={variant} priority={i < 3} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
