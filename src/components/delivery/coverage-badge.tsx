import type { LocationResolution } from "@/features/delivery/types";

import { Tag } from "@/components/lx/primitives";

/** States the coverage result in words, with a marker. The rates behind it are still sample rates. */
export function CoverageBadge({
  resolution,
}: {
  resolution: LocationResolution;
}) {
  if (resolution.coverage === "in-nigeria") {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <Tag tone="success">We deliver here</Tag>
        <span>
          {resolution.stateName}
          {resolution.regionName ? `, ${resolution.regionName} region` : ""}
        </span>
      </p>
    );
  }
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <Tag tone="warning">Outside Nigeria</Tag>
      <span>
        This point is not inside a Nigerian state. Move the pin or choose a
        state.
      </span>
    </p>
  );
}
