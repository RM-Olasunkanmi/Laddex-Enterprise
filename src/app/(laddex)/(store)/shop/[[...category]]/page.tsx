import { notFound } from "next/navigation";
import { Suspense } from "react";

import type { CategoryId } from "@/features/catalogue/types";

import { CatalogueBrowser } from "@/components/commerce/catalogue-browser";
import { ShopSkeleton } from "@/components/commerce/shop-skeleton";

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

export default async function ShopPage({
  params,
}: {
  params: Promise<{ category?: string[] }>;
}) {
  const { category } = await params;
  const slug = category?.[0];
  if (
    category &&
    (category.length > 1 ||
      (slug !== "palm-oil" && slug !== "tapioca" && slug !== "garri"))
  )
    notFound();
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <CatalogueBrowser category={(slug as CategoryId | undefined) ?? "all"} />
    </Suspense>
  );
}
