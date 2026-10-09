import type { LocationResolution } from "@/features/delivery/types";

import { Tag } from "@/components/lx/primitives";

/** States whether the location can be checked against the illustrative delivery regions. */
export function CoverageBadge({
  resolution,
}: {
  resolution: LocationResolution;
}) {
  if (resolution.coverage === "in-nigeria") {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <Tag tone="info">Availability check available</Tag>
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
