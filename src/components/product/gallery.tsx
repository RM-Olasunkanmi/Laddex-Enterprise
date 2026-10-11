"use client";

import Image from "next/image";
import { useState } from "react";

import type { Product } from "@/features/catalogue/types";

/** Below this source width a photo is shown whole on a backdrop instead of cropped and enlarged. */
const SMALL_SOURCE_PX = 300;

/**
 * Main image plus real thumbnails. Photographs come from the product's `photographs` list; any
 * provenance note ("Sample photo supplied by Laddex") is shown as a caption, not over the product.
 */
export function ProductGallery({ product }: { product: Product }) {
  const photos = product.photographs;
  const [selected, setSelected] = useState(photos[0]?.id);
  const active = photos.find((p) => p.id === selected) ?? photos[0];
  if (!active) return null;
  const small = active.width < SMALL_SOURCE_PX;
  return (
    <figure>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-paper-2 sm:aspect-[5/4]">
        <div
          key={active.id}
          className="absolute inset-0 animate-[fadein_var(--d-slow)_var(--ease)]"
        >
          {small ? (
            <div className="flex h-full items-center justify-center p-5">
              <Image
                src={active.src}
                alt={active.alt}
                width={active.width}
                height={active.height}
                priority
                sizes={`${active.width * 2}px`}
                className="h-full w-auto max-w-full rounded-md object-contain shadow-raised"
              />
            </div>
          ) : (
            <Image
              src={active.src}
              alt={active.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              style={{ objectPosition: active.position ?? "50% 50%" }}
            />
          )}
        </div>
      </div>
      {photos.length > 1 && (
        <ul className="mt-3 flex gap-2" aria-label="Product photos">
          {photos.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={p.id === active.id}
                aria-label={`Show photo: ${p.alt}`}
                onClick={() => setSelected(p.id)}
                className={`relative block h-16 w-16 overflow-hidden rounded-md border-2 transition-colors sm:h-20 sm:w-20 ${p.id === active.id ? "border-forest" : "border-transparent opacity-80 hover:opacity-100"}`}
              >
                <Image
                  src={p.src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  style={{ objectPosition: p.position ?? "50% 50%" }}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      {active.note && (
        <figcaption className="hint mt-2">{active.note}</figcaption>
      )}
    </figure>
  );
}
