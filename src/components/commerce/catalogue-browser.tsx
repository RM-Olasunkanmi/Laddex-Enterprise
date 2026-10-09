"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { ProductCard } from "./product-card";

import type { CategoryId } from "@/features/catalogue/types";

import { useCatalogue } from "@/components/lx/catalogue-provider";
import {
  applyQuery,
  normaliseQuery,
  sortOptions,
  type CatalogueQuery,
  type SortKey,
} from "@/features/catalogue/selectors";

function parse(
  params: URLSearchParams,
  category: CategoryId | "all",
): CatalogueQuery {
  return {
    category,
    inStockOnly: params.get("stock") === "1",
    sort: (params.get("sort") as SortKey) || "featured",
  };
}

export function CatalogueBrowser({
  category,
}: {
  category: CategoryId | "all";
}) {
  const { products, categories } = useCatalogue();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const query = useMemo(
    () =>
      normaliseQuery(parse(new URLSearchParams(params.toString()), category)),
    [params, category],
  );
  const results = useMemo(() => applyQuery(products, query), [products, query]);
  const sorts = sortOptions(category);

  const update = (patch: Partial<CatalogueQuery>) => {
    const next = { ...query, ...patch };
    const sp = new URLSearchParams();
    if (next.inStockOnly) sp.set("stock", "1");
    if (next.sort !== "featured") sp.set("sort", next.sort);
    router.replace(sp.size ? `${pathname}?${sp}` : pathname, { scroll: false });
  };
  const clear = () => router.replace(pathname, { scroll: false });
  const tabs = [
    { href: "/shop", label: "All products", active: category === "all" },
    ...categories.map((c) => ({
      href: `/shop/${c.id}`,
      label: c.name,
      active: category === c.id,
    })),
  ];
  const info = categories.find((c) => c.id === category);

  return (
    <div className="wrap py-10">
      <header className="max-w-2xl">
        <p className="eyebrow mb-3">
          {info ? info.tagline : "Palm oil, tapioca flakes and garri"}
        </p>
        <h1 className="text-4xl md:text-5xl">
          {info ? info.name : "All products"}
        </h1>
        <p className="mt-3 text-ink-2">
          {info
            ? info.blurb
            : "Choose a product, pick a size, and see the price per litre or kilo before you add it to the cart."}
        </p>
      </header>

      <nav
        aria-label="Category"
        className="mt-8 flex gap-1 border-b border-line overflow-x-auto"
      >
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={`px-4 min-h-11 grid place-items-center whitespace-nowrap border-b-2 -mb-px ${t.active ? "border-ember font-semibold" : "border-transparent text-ink-2 hover:text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p role="status" aria-live="polite" className="text-ink-2">
          <span className="mono text-ink">{results.length}</span>{" "}
          {results.length === 1 ? "product" : "products"}
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <label className="flex items-center gap-3 min-h-11 cursor-pointer text-sm">
            <input
              type="checkbox"
              className="accent-ember w-4 h-4"
              checked={query.inStockOnly}
              onChange={(e) => update({ inStockOnly: e.target.checked })}
            />
            <span>Hide products with no stock</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-2">Sort</span>
            <select
              className="field !min-h-10 !w-auto"
              value={query.sort}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
            >
              {sorts.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section aria-label="Results" className="mt-5">
        {results.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="font-display text-2xl">
              No products match these filters
            </p>
            <p className="mt-2 text-ink-2">
              Show products with no stock again, or pick another category.
            </p>
            <button className="btn btn-ink mt-5" onClick={clear}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-5 grid-cols-2 xl:grid-cols-4">
            {results.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
