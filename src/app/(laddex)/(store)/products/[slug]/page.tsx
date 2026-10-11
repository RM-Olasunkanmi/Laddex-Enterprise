import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/commerce/product-card";
import { Notice, SampleTag } from "@/components/lx/primitives";
import { ProductPurchase } from "@/components/product/buy-box";
import { getCatalogue } from "@/features/catalogue";
import { cheapestPerUnit } from "@/features/catalogue/pricing";
import { relatedProducts } from "@/features/catalogue/selectors";
import { formatNaira } from "@/lib/formatters";

export const generateStaticParams = async () =>
  (await getCatalogue().listProducts()).map((product) => ({ slug: product.slug }));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getCatalogue().getProduct(slug);
  return p ? { title: p.name, description: p.summary } : {};
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pack?: string }>;
}) {
  const [{ slug }, { pack }] = await Promise.all([params, searchParams]);
  const catalogue = getCatalogue();
  const product = await catalogue.getProduct(slug);
  if (!product) notFound();
  const all = await catalogue.listProducts();
  const related = relatedProducts(product, all);
  const best = cheapestPerUnit(product)!;
  const unit = product.baseUnit === "l" ? "litre" : "kilo";
  const isIllustrative = product.variants.some(
    (variant) => variant.dataStatus === "illustrative",
  );
  const categoryName =
    product.category === "palm-oil"
      ? "Palm oil"
      : product.category === "tapioca"
        ? "Tapioca flakes"
        : "Garri";
  return (
    <div className="wrap pb-32 pt-6 lg:pb-24 lg:pt-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-3">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="hover:text-ink hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="hover:text-ink hover:underline">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/shop/${product.category}`}
              className="hover:text-ink hover:underline"
            >
              {categoryName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <ProductPurchase product={product} initialPack={pack} />

      <div className="mt-16 grid gap-12 border-t border-line pt-12 lg:mt-24 lg:grid-cols-12 lg:gap-14">
        <section aria-labelledby="about" className="lg:col-span-6 xl:col-span-7">
          <p className="eyebrow">About the product</p>
          <h2 id="about" className="mt-3 text-3xl md:text-4xl">
            {product.name}
          </h2>
          <div className="mt-5 max-w-prose space-y-4 leading-relaxed text-ink-2">
            {product.description.map((d) => (
              <p key={d}>{d}</p>
            ))}
          </div>
          {product.usage.length > 0 && (
            <>
              <h3 className="mt-8 text-xl">Bought for</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.usage.map((u) => (
                  <li key={u} className="rounded-full bg-paper-2 px-3 py-1.5 text-sm text-ink-2">
                    {u}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-8 text-sm text-ink-3">
            Larger packs cost less per {unit}. The lowest listed price is{" "}
            {formatNaira(best.perUnitKobo)} per {unit}.
          </p>
        </section>

        <section aria-labelledby="specs" className="lg:col-span-6 xl:col-span-5">
          <p className="eyebrow">Details</p>
          <h2 id="specs" className="mt-3 text-3xl md:text-4xl">
            Specifications
          </h2>
          <dl className="mt-5 divide-y divide-line border-y border-line">
            {product.specs.map((s) => (
              <div
                key={s.label}
                className="grid grid-cols-[8.5rem_1fr] gap-4 py-3.5 text-sm"
              >
                <dt className="text-ink-3">{s.label}</dt>
                <dd>
                  {s.value}
                  {s.note && (
                    <span className="mt-1 block text-xs text-ink-3">
                      {s.note}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {product.packagingNotes.length > 0 && (
            <>
              <h3 className="mt-8 text-xl">Packaging</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-2">
                {product.packagingNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </>
          )}
          {isIllustrative && (
            <Notice tone="sample" className="mt-6" title="Illustrative catalogue">
              Sizes, prices and stock are sample values. Specification fields
              marked &ldquo;to be confirmed&rdquo; are left open on purpose.{" "}
              <SampleTag />
            </Notice>
          )}
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related">
          <div className="flex items-end justify-between gap-4">
            <h2 id="related" className="text-3xl md:text-4xl">
              Also from Laddex
            </h2>
            <Link href="/shop" className="text-link hidden sm:inline">
              All products &rarr;
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {related.slice(0, 3).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
