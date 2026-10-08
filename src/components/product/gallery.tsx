"use client";

import { useState } from "react";

import { PackLadder } from "@/components/product/pack-ladder";
import { PackVisual } from "@/components/product/pack-visual";
import { packScale } from "@/components/product/pack-ladder";
import { PACKAGING_LABEL } from "@/components/lx/labels";
import { Tag } from "@/components/lx/primitives";
import { packLabel } from "@/features/catalogue/selectors";
import type { PackVariant, Product } from "@/features/catalogue/types";

type Slide = { id: string; label: string; node: React.ReactNode };

/**
 * Gallery with thumbnails. Photographs, when supplied in `product.photographs`, come first.
 * Until then every slide is a development render and is labelled as such.
 */
export function ProductGallery({ product, variant }: { product: Product; variant: PackVariant }) {
  const [selected, setSelected] = useState("pack");
  const photos = product.photographs.filter((p) => p.src);
  const slides: Slide[] = [
    ...photos.map<Slide>((p) => ({
      id: p.id,
      label: p.alt,
      // eslint-disable-next-line @next/next/no-img-element
      node: <img src={p.src} alt={p.alt} className="w-full h-full object-cover" loading="eager" />,
    })),
    {
      id: "pack",
      label: `${packLabel(variant)} pack`,
      node: <PackVisual packaging={variant.packaging} category={product.category} sizeLabel={packLabel(variant)} scale={0.62 + 0.38 * (packScale(variant, product) - 0.5) / 0.5} className="w-full h-full p-6" />,
    },
    { id: "range", label: "Full range to scale", node: <div className="h-full grid place-items-center p-5"><PackLadder product={product} activeId={variant.id} tone={product.category === "palm-oil" ? "ember" : "slate"} compact /></div> },
    {
      id: "label",
      label: "Pack facts",
      node: (
        <div className="h-full p-6 sm:p-10 flex flex-col justify-center">
          <p className="eyebrow">Pack facts</p>
          <p className="font-display text-6xl mt-2">{packLabel(variant)}</p>
          <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm max-w-sm">
            <dt className="text-ink-3">Packaging</dt><dd>{PACKAGING_LABEL[variant.packaging]}</dd>
            <dt className="text-ink-3">Format</dt><dd className="capitalize">{variant.format}</dd>
            <dt className="text-ink-3">SKU</dt><dd className="mono">{variant.sku}</dd>
            <dt className="text-ink-3">Shipping weight</dt><dd className="mono">about {variant.shippingWeightKg} kg</dd>
          </dl>
          <div className="mt-6"><Tag tone="sample">Illustrative values</Tag></div>
        </div>
      ),
    },
  ];
  const active = slides.find((s) => s.id === selected) ?? slides[0];
  const isRender = !photos.some((p) => p.id === active.id);
  return (
    <div>
      <div className="relative bg-paper-2 border border-line rounded-md aspect-[4/3] lg:aspect-[5/4] overflow-hidden">
        <div key={active.id} className="absolute inset-0 animate-[fadein_var(--d-base)_var(--ease)]">
          {active.node}
        </div>
        {isRender && (
          <span className="absolute left-3 top-3">
            <Tag tone="sample">Development render</Tag>
          </span>
        )}
      </div>
      <ul className="mt-3 grid grid-cols-4 gap-2 list-none p-0" aria-label="Product views">
        {slides.map((s) => (
          <li key={s.id}>
            <button type="button" aria-pressed={s.id === active.id} onClick={() => setSelected(s.id)} className={`w-full min-h-11 px-2 py-2 text-xs rounded-sm border text-left ${s.id === active.id ? "border-ink bg-card" : "border-line bg-paper hover:border-ink-3"}`}>
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
