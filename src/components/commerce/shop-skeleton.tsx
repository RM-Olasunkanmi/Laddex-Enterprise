/** Placeholder with the same footprint as the catalogue, so loading it causes no layout shift. */
export function ShopSkeleton() {
  return (
    <div className="wrap py-10" aria-busy="true" aria-label="Loading packs">
      <div className="skel h-4 w-32 mb-4" />
      <div className="skel h-12 w-72 mb-3" />
      <div className="skel h-5 w-full max-w-xl mb-8" />
      <div className="skel h-11 w-full max-w-md mb-6" />
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <div className="hidden lg:block space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skel h-8" />
          ))}
        </div>
        <div className="grid gap-3 sm:gap-5 grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-line rounded-md bg-card overflow-hidden"
            >
              <div className="skel aspect-[4/3] sm:aspect-[5/4] rounded-none" />
              <div className="p-3 sm:p-4 space-y-3">
                <div className="skel h-5 w-2/3" />
                <div className="skel h-4 w-1/3" />
                <div className="skel h-11 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
