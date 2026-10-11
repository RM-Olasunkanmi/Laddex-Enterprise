import Image from "next/image";
import Link from "next/link";

import { CartButton, MobileNavButton, PrimaryNav } from "./header-client";
import { ThemeToggle } from "./theme-toggle";

export { NAV } from "./nav";

export function Wordmark({
  className = "",
  size = 40,
  tone = "default",
}: {
  className?: string;
  size?: number;
  tone?: "default" | "on-dark";
}) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 ${tone === "on-dark" ? "text-rail-text" : "text-ink"} ${className}`}
    >
      <Image
        src="/brand/laddex-logo.png"
        alt=""
        width={size}
        height={size}
        priority
        className="rounded-full"
      />
      <span className="leading-none max-[339px]:sr-only">
        <span className="block font-display text-[1.375rem] font-semibold tracking-tight">
          Laddex
        </span>
        <span
          className={`mt-0.5 block text-[0.5625rem] font-semibold uppercase tracking-[0.28em] ${tone === "on-dark" ? "text-rail-text/70" : "text-ink-3"}`}
        >
          {" "}
          Enterprise
        </span>
        <span className="sr-only">, home</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80">
      <div className="wrap flex h-16 items-center gap-3 lg:h-[4.5rem]">
        <Wordmark />
        <PrimaryNav />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="hidden sm:inline-flex !border-transparent" />
          <CartButton />
          <MobileNavButton />
        </div>
      </div>
    </header>
  );
}
