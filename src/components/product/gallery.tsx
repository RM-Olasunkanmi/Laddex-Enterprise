"use client";

import Image from "next/image";
import { useState } from "react";

import type { Product } from "@/features/catalogue/types";

import { Tag } from "@/components/lx/primitives";

/**
 * Main image plus real thumbnails. Photographs come from the product's `photographs` list; the
 * provenance note ("Sample photo supplied by Laddex") stays visible until final photography replaces them.
 */
export function ProductGallery({ product }: { product: Product }) {
  const photos = product.photographs;
  const [selected, setSelected] = useState(photos[0]?.id);
  const active = photos.find((p) => p.id === selected) ?? photos[0];
  if (!active) return null;
  const portrait = active.height > active.width * 1.2;
  return (
    <div>
      <div
        className={`relative bg-paper-2 border border-line rounded-md overflow-hidden ${portrait ? "aspect-[4/5]" : "aspect-[4/3]"}`}
      >
        <div
          key={active.id}
          className="absolute inset-0 animate-[fadein_var(--d-base)_var(--ease)]"
        >
          <Image
            src={active.src}
            alt={active.alt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            style={{ objectPosition: active.position ?? "50% 50%" }}
          />
        </div>
        {active.note && (
          <span className="absolute left-3 top-3">
            <Tag tone="sample">{active.note}</Tag>
          </span>
        )}
      </div>
      {photos.length > 1 && (
        <ul
          className="mt-3 grid grid-cols-5 gap-2 list-none p-0"
          aria-label="Product photos"
        >
          {photos.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={p.id === active.id}
                aria-label={p.alt}
                onClick={() => setSelected(p.id)}
                className={`relative block w-full aspect-square rounded-sm overflow-hidden border-2 ${p.id === active.id ? "border-ink" : "border-line hover:border-ink-3"}`}
              >
                <Image
                  src={p.src}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                  style={{ objectPosition: p.position ?? "50% 50%" }}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
