import type { MetadataRoute } from "next";

const baseUrl = (
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXT_PUBLIC_SERVER_URL ??
  "http://localhost:3344"
).replace(/\/$/, "");

if (process.env.VERCEL_ENV === "production" && !baseUrl.startsWith("https://")) {
  throw new Error("NEXT_PUBLIC_BASE_URL must be the production HTTPS origin.");
}

export default function robots(): MetadataRoute.Robots {
  return {
    host: baseUrl,
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/admin",
          "/api",
          "/cart",
          "/checkout",
          "/dashboard",
          "/order",
          "/wholesale/quote",
          "/wholesale/register",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
