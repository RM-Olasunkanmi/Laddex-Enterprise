import { ButtonLink } from "@/components/lx/primitives";

export default function NotFound() {
  return (
    <div className="wrap py-24 max-w-xl">
      <p className="eyebrow mb-3">404</p>
      <h1 className="text-4xl">That page is not in the catalogue</h1>
      <p className="mt-3 text-ink-2">The link may be old or mistyped.</p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/shop/palm-oil">Palm oil</ButtonLink>
        <ButtonLink href="/shop/tapioca" variant="ink">
          Tapioca
        </ButtonLink>
      </div>
    </div>
  );
}
