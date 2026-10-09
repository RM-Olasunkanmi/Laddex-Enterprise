import type { MetadataRoute } from "next";

import { getCatalogue } from "@/features/catalogue";

const baseUrl = (
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXT_PUBLIC_SERVER_URL ??
  "http://localhost:3344"
).replace(/\/$/, "");

if (process.env.VERCEL_ENV === "production" && !baseUrl.startsWith("https://")) {
  throw new Error("NEXT_PUBLIC_BASE_URL must be the production HTTPS origin.");
}

const staticRoutes = [
  "",
  "/shop",
  "/wholesale",
  "/events",
  "/delivery",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalogue = getCatalogue();
  const [categories, products] = await Promise.all([
    catalogue.listCategories(),
    catalogue.listProducts(),
  ]);
  return [
    ...staticRoutes.map((path) => ({ url: `${baseUrl}${path || "/"}` })),
    ...categories.map((category) => ({
      url: `${baseUrl}/shop/${encodeURIComponent(category.id)}`,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/products/${encodeURIComponent(product.slug)}`,
    })),
  ];
}
