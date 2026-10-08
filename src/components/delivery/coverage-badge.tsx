import { Tag } from "@/components/lx/primitives";
import type { LocationResolution } from "@/features/delivery/types";

/** States the sample coverage result in words, with a marker, and never implies verified coverage. */
export function CoverageBadge({ resolution }: { resolution: LocationResolution }) {
  if (resolution.coverage === "sample-zone") {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <Tag tone="info">Inside sample zone</Tag>
        <span>{resolution.zoneName}</span>
      </p>
    );
  }
  if (resolution.coverage === "outside-sample-zones") {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <Tag tone="warning">Outside sample zones</Tag>
        <span>{resolution.lgaName} is not in a configured sample zone. A written quote is needed.</span>
      </p>
    );
  }
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <Tag tone="warning">Outside loaded area</Tag>
      <span>{resolution.stateName ? `${resolution.stateName} State is` : "This point is"} outside the Lagos boundaries used in this prototype.</span>
    </p>
  );
}
