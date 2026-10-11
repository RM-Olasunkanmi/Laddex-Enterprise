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
  // The stock filter only earns its place when it would actually hide something.
  const someOutOfStock = products.some(
    (p) =>
      (category === "all" || p.category === category) &&
      p.variants.every((v) => v.stock.status === "out-of-stock"),
  );

  const update = (patch: Partial<CatalogueQuery>) => {
    const next = { ...query, ...patch };
    const sp = new URLSearchParams();
    if (next.inStockOnly) sp.set("stock", "1");
    if (next.sort !== "featured") sp.set("sort", next.sort);
    router.replace(sp.size ? `${pathname}?${sp}` : pathname, { scroll: false });
  };
  const clear = () => router.replace(pathname, { scroll: false });
  const countIn = (id: CategoryId | "all") =>
    products.filter((p) => id === "all" || p.category === id).length;
  const tabs = [
    { href: "/shop", label: "All products", active: category === "all", n: countIn("all") },
    ...categories.map((c) => ({
      href: `/shop/${c.id}`,
      label: c.name,
      active: category === c.id,
      n: countIn(c.id),
    })),
  ];
  const info = categories.find((c) => c.id === category);
  const keep = params.toString() ? `?${params.toString()}` : "";

  return (
    <div className="wrap pb-16 pt-8 lg:pb-24 lg:pt-12">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="hover:text-ink hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          {info ? (
            <>
              <li>
                <Link href="/shop" className="hover:text-ink hover:underline">
                  Shop
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">
                {info.name}
              </li>
            </>
          ) : (
            <li aria-current="page" className="text-ink">
              Shop
            </li>
          )}
        </ol>
      </nav>

      <header className="mt-5 grid gap-4 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h1 className="display text-[2.5rem] sm:text-5xl lg:text-6xl">
            {info ? info.name : "Shop all products"}
          </h1>
          <p className="lede mt-4 max-w-2xl">
            {info
              ? info.blurb
              : "Pick a size on any product to see its price, its price per litre or kilo, and its stock. Add it to your cart without leaving this page."}
          </p>
        </div>
      </header>

      <div className="sticky top-16 z-20 -mx-[var(--gutter)] mt-8 border-y border-line bg-paper/95 px-[var(--gutter)] backdrop-blur lg:top-[4.5rem]">
        <div className="flex flex-col gap-2 py-2 md:flex-row md:items-center md:justify-between md:gap-6">
          <nav
            aria-label="Product categories"
            className="-mx-[var(--gutter)] flex gap-1.5 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] md:mx-0 md:px-0"
          >
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href + keep}
                scroll={false}
                aria-current={t.active ? "page" : undefined}
                className="chip shrink-0 whitespace-nowrap"
                data-selected={t.active || undefined}
              >
                {t.label}
                <span
                  className={`num ml-1.5 text-xs ${t.active ? "text-on-forest/75" : "text-ink-3"}`}
                >
                  {t.n}
                </span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {(someOutOfStock || query.inStockOnly) && (
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--color-forest)]"
                  checked={query.inStockOnly}
                  onChange={(e) => update({ inStockOnly: e.target.checked })}
                />
                In stock only
              </label>
            )}
            <label className="ml-auto flex items-center gap-2 text-sm md:ml-0">
              <span className="text-ink-3">Sort</span>
              <select
                className="field !min-h-10 !w-auto !py-1 text-sm"
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
      </div>

      <p role="status" aria-live="polite" className="mt-6 text-sm text-ink-3">
        Showing <span className="num font-semibold text-ink">{results.length}</span>{" "}
        {results.length === 1 ? "product" : "products"}
        {query.inStockOnly ? " in stock" : ""}
      </p>

      <section aria-label="Products" className="mt-4">
        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong p-10 text-center">
            <p className="font-display text-2xl">Nothing in stock here right now</p>
            <p className="mx-auto mt-2 max-w-md text-ink-2">
              Show every product again, or ask us when it will be back. We can
              often quote a restock date.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button className="btn btn-primary" onClick={clear}>
                Show all products
              </button>
              <Link href="/contact" className="btn btn-line">
                Ask about stock
              </Link>
            </div>
          </div>
        ) : (
          <div
            key={`${category}-${query.sort}-${query.inStockOnly}`}
            className="page-in grid gap-6 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4"
          >
            {results.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        )}
      </section>

      <aside className="mt-14 grid gap-6 rounded-lg bg-paper-2 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-2xl">Buying for a shop, kitchen or event?</h2>
          <p className="mt-2 max-w-xl text-ink-2">
            Send the quantities you need and where they are going. We reply
            with a written quote and delivery options.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/wholesale/quote" className="btn btn-ink">
            Request a quote
          </Link>
          <Link href="/events" className="btn btn-line">
            Event orders
          </Link>
        </div>
      </aside>
    </div>
  );
}
