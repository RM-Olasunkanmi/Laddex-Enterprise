import Link from "next/link";

import { PACKAGING_LABEL } from "@/components/lx/labels";
import { StockTag, Tag } from "@/components/lx/primitives";
import { pricePerBaseUnit } from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";
import type { Product } from "@/features/catalogue/types";
import { formatNaira } from "@/lib/formatters";

/** Every pack of one product in a scannable ledger. Becomes stacked rows on small screens. */
export function PackTable({ product }: { product: Product }) {
  const rows = [...product.variants].sort((a, b) => a.contentBase - b.contentBase);
  const unit = product.baseUnit === "l" ? "L" : "kg";
  return (
    <div className="panel overflow-hidden">
      <table className="dtable [&_th]:bg-card w-full">
        <caption className="text-left px-4 py-3 border-b border-line">
          <span className="font-display text-lg">{product.name}</span>
          <span className="mono text-xs text-ink-3 ml-3 uppercase tracking-wider">Sold by the {product.baseUnit === "l" ? "litre" : "kilo"}</span>
        </caption>
        <thead className="max-sm:sr-only">
          <tr>
            <th scope="col">Pack</th>
            <th scope="col" className="max-md:hidden">Packaging</th>
            <th scope="col">Format</th>
            <th scope="col" className="!text-right">Price</th>
            <th scope="col" className="!text-right">Per {unit}</th>
            <th scope="col" className="!text-right max-lg:hidden">Wholesale from</th>
            <th scope="col" className="max-sm:hidden">Stock</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} className="max-sm:grid max-sm:grid-cols-2 max-sm:gap-y-1 max-sm:py-3 max-sm:border-b max-sm:border-line">
              <td className="font-display text-lg whitespace-nowrap max-sm:border-0">
                <Link href={`/products/${product.slug}?pack=${v.id}`} className="underline-offset-4 hover:underline">
                  {packLabel(v)}
                </Link>
              </td>
              <td className="max-md:hidden">{PACKAGING_LABEL[v.packaging]}</td>
              <td className="max-sm:border-0">
                <Tag tone={v.format === "bulk" ? "sample" : "default"}>{v.format}</Tag>
              </td>
              <td className="r max-sm:border-0">{formatNaira(v.retailPriceKobo)}</td>
              <td className="r text-ink-3 max-sm:border-0">{formatNaira(pricePerBaseUnit(v))}</td>
              <td className="r max-lg:hidden">
                {v.wholesaleTiers.length ? `${v.wholesaleMinQty}+ packs` : "—"}
              </td>
              <td className="whitespace-nowrap max-sm:col-span-2 max-sm:border-0">
                <StockTag status={v.stock.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
