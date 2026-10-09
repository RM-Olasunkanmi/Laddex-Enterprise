import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/commerce/product-card";
import { Notice, SampleTag } from "@/components/lx/primitives";
import { ProductPurchase } from "@/components/product/buy-box";
import { getCatalogue } from "@/features/catalogue";
import { cheapestPerUnit } from "@/features/catalogue/pricing";
import { relatedProducts } from "@/features/catalogue/selectors";
import { PRODUCTS } from "@/fixtures/products/products";
import { formatNaira } from "@/lib/formatters";

export const generateStaticParams = () =>
  PRODUCTS.map((p) => ({ slug: p.slug }));

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
  return (
    <div className="wrap py-8 pb-28 lg:pb-12">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-3 mb-6">
        <ol className="flex flex-wrap gap-2 list-none p-0">
          <li>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/shop/${product.category}`}
              className="hover:underline"
            >
              {product.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            Pack sizes
          </li>
        </ol>
      </nav>

      <ProductPurchase product={product} initialPack={pack} />

      <div className="mt-16 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="about">
          <h2 id="about" className="text-3xl">
            About {product.name.toLowerCase()}
          </h2>
          <div className="mt-4 space-y-4 text-ink-2 max-w-prose">
            {product.description.map((d) => (
              <p key={d}>{d}</p>
            ))}
          </div>
          <h3 className="!text-xl mt-8">Typical uses</h3>
          <ul className="mt-3 list-disc pl-5 text-ink-2 space-y-1">
            {product.usage.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-3">
            Larger packs cost less per {unit}. In these sample prices the lowest
            is {formatNaira(best.perUnitKobo)} per {unit}.
          </p>
        </section>

        <section aria-labelledby="specs">
          <h2 id="specs" className="text-3xl">
            Specifications
          </h2>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {product.specs.map((s) => (
              <div
                key={s.label}
                className="py-3 grid grid-cols-[9rem_1fr] gap-4 text-sm"
              >
                <dt className="text-ink-3">{s.label}</dt>
                <dd>
                  {s.value}
                  {s.note && (
                    <span className="block text-xs text-ink-3 mt-1">
                      {s.note}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <h3 className="!text-xl mt-8">Packaging</h3>
          <ul className="mt-3 list-disc pl-5 text-ink-2 space-y-1 text-sm">
            {product.packagingNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <Notice tone="sample" className="mt-6" title="Illustrative catalogue">
            Sizes, prices and stock are sample values. Specification fields
            marked &ldquo;to be confirmed&rdquo; are left open on purpose.{" "}
            <SampleTag />
          </Notice>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related">
          <h2 id="related" className="text-3xl">
            Also from Laddex
          </h2>
          <div className="mt-6 grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
