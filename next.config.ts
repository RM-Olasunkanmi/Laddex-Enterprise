import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";

import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

import appConfig from "@/lib/core/config";

const withNextIntl = createNextIntlPlugin("./src/lib/intl/request.ts");
const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.paystack.co https://nominatim.openstreetmap.org https://tiles.openfreemap.org https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.google-analytics.com https://*.analytics.google.com https://*.facebook.com https://*.tiktok.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://checkout.paystack.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.paystack.com",
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const remotePatternsFromConfig = (): RemotePattern[] => {
  const patterns: RemotePattern[] = [];

  if (appConfig.SERVER_URL) {
    const baseUrl = new URL(appConfig.SERVER_URL);
    patterns.push(
      ...["media", "seo-media", "gallery-media"].map((collection) => ({
        protocol: baseUrl.protocol.slice(0, -1) as "http" | "https",
        hostname: baseUrl.hostname,
        ...(baseUrl.port ? { port: baseUrl.port } : {}),
        pathname: `/api/${collection}/file/**`,
      })),
    );
  }

  if (appConfig.STORAGE_URL) {
    const storageUrl = new URL(appConfig.STORAGE_URL);

    patterns.push({
      protocol: storageUrl.protocol.slice(0, -1) as "http" | "https",
      hostname: storageUrl.hostname,
      ...(storageUrl.port ? { port: storageUrl.port } : {}),
      pathname: "/**",
    });
  }

  return patterns;
};
const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  typescript: { ignoreBuildErrors: false },
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    formats: ["image/avif", "image/webp"],
    remotePatterns: remotePatternsFromConfig(),
  },
  allowedDevOrigins:
    process.env.NODE_ENV === "development"
      ? [new URL(appConfig.SERVER_URL).hostname]
      : undefined,

  experimental: {
    optimizePackageImports: ["react-icons", "@radix-ui/react-label"],
  },

  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value:
            "camera=(), microphone=(), geolocation=(self), payment=(self)",
        },
        ...(isProduction
          ? [
              {
                key: "Strict-Transport-Security",
                value: "max-age=31536000; includeSubDomains",
              },
            ]
          : []),
      ],
    },
  ],
};

export default withPayload(withNextIntl(nextConfig));
