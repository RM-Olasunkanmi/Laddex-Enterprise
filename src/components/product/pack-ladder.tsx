import type { PackVariant, Product } from "@/features/catalogue/types";

import { PackVisual } from "@/components/product/pack-visual";
import { pricePerBaseUnit } from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";
import { formatNaira } from "@/lib/formatters";

/** Relative drawing scale for a pack within its product: cube-root so volume reads as size. */
export function packScale(v: PackVariant, product: Product): number {
  const max = Math.max(...product.variants.map((x) => x.contentBase));
  return 0.5 + 0.5 * Math.cbrt(v.contentBase / max);
}

/** Every size of a product on one baseline, so relative sizes and unit prices read at a glance. */
export function PackLadder({
  product,
  activeId,
  tone = "ember",
  compact = false,
}: {
  product: Product;
  activeId?: string;
  tone?: "ember" | "slate";
  compact?: boolean;
}) {
  const variants = [...product.variants].sort(
    (a, b) => a.contentBase - b.contentBase,
  );
  return (
    <figure className="m-0">
      <ol
        className="flex items-end gap-1 sm:gap-3 list-none p-0 m-0"
        aria-label={`${product.name} pack sizes, to relative scale`}
      >
        {variants.map((v) => {
          const per = pricePerBaseUnit(v);
          const active = v.id === activeId;
          return (
            <li
              key={v.id}
              className="flex-1 min-w-0 flex flex-col items-center justify-end"
            >
              <PackVisual
                packaging={v.packaging}
                category={product.category}
                sizeLabel={packLabel(v)}
                scale={packScale(v, product)}
                caption={false}
                className={`w-full ${compact ? "h-28 sm:h-36" : "h-40 sm:h-60 lg:h-72"}`}
              />
              <div
                className={`mt-2 w-full text-center border-t pt-2 ${active ? (tone === "ember" ? "border-ember" : "border-slate") : "border-ink/30"}`}
              >
                <p className="font-display text-sm sm:text-lg leading-none">
                  {packLabel(v)}
                </p>
                <p className="mono text-[0.625rem] sm:text-xs text-ink-3 mt-1">
                  {formatNaira(per)}/{product.baseUnit === "l" ? "L" : "kg"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <figcaption className="mono text-[0.6875rem] uppercase tracking-wider text-ink-3 mt-3">
        Development renders to relative scale. Prices illustrative.
      </figcaption>
    </figure>
  );
}
