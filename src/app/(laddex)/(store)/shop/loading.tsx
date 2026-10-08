export default function Loading() {
  return (
    <div className="wrap py-10" aria-busy="true" aria-label="Loading packs">
      <div className="skel h-4 w-32 mb-4" />
      <div className="skel h-12 w-72 mb-10" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 lg:ml-[16.5rem]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-line rounded-md bg-card overflow-hidden">
            <div className="skel aspect-[5/4] rounded-none" />
            <div className="p-4 space-y-3">
              <div className="skel h-5 w-2/3" />
              <div className="skel h-4 w-1/3" />
              <div className="skel h-11 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
