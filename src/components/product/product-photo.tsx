import Image from "next/image";

import type { Product } from "@/features/catalogue/types";

interface Props {
  product: Product;
  /** Which photograph; the first is the main one. */
  index?: number;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * A product photograph at a fixed ratio chosen by the parent (via className), cropped with
 * object-fit. When no photograph exists it shows a plain "photo to come" tile, never a drawing
 * that could be mistaken for the real packaging.
 */
export function ProductPhoto({ product, index = 0, sizes, priority = false, className = "" }: Props) {
  const img = product.photographs[index] ?? product.photographs[0];
  if (!img) {
    return (
      <div className={`grid place-items-center bg-paper-2 text-ink-3 text-sm ${className}`}>
        <span>Photo to come</span>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-paper-2 ${className}`}>
      <Image
        src={img.src}
        alt={img.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        style={{ objectPosition: img.position ?? "50% 50%" }}
      />
    </div>
  );
}
