import { notFound } from "next/navigation";
import { Suspense } from "react";

import type { CategoryId } from "@/features/catalogue/types";

import { CatalogueBrowser } from "@/components/commerce/catalogue-browser";
import { ShopSkeleton } from "@/components/commerce/shop-skeleton";
import { getCatalogue } from "@/features/catalogue";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category?: string[] }>;
}) {
  const { category } = await params;
  const c = category?.[0];
  return {
    title:
      c === "palm-oil"
        ? "Palm oil"
        : c === "tapioca"
          ? "Tapioca flakes"
          : c === "garri"
            ? "Garri"
            : "All products",
  };
}

/**
 * `?latency=ms` and `?fail=catalogue` exercise the loading and error states during design
 * review. They only affect the fixture adapter.
 */
export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ category?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const slug = category?.[0];
  if (
    category &&
    (category.length > 1 || (slug !== "palm-oil" && slug !== "tapioca" && slug !== "garri"))
  )
    notFound();
  // Awaiting the catalogue here (not only in the layout) lets the diagnostics apply to this route.
  await getCatalogue({
    latencyMs: Number(sp.latency) || 0,
    fail: sp.fail === "catalogue",
  }).listProducts();
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <CatalogueBrowser category={(slug as CategoryId | undefined) ?? "all"} />
    </Suspense>
  );
}
