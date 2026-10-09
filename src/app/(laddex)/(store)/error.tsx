"use client";

import Link from "next/link";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="wrap py-24 max-w-xl">
      <p className="eyebrow mb-3">Something went wrong</p>
      <h1 className="text-4xl">We could not load this page</h1>
      <p className="mt-3 text-ink-2">
        {error.message || "The catalogue is temporarily unavailable."} Your cart
        is stored on this device and has not changed.
      </p>
      <div className="mt-6 flex gap-3">
        <button className="btn btn-ink" onClick={reset}>
          Try again
        </button>
        <Link className="btn btn-line" href="/">
          Back to the homepage
        </Link>
      </div>
    </div>
  );
}
