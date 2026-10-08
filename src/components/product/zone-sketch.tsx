import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SAMPLE_ZONES } from "@/fixtures/geography/zones";
import { chart, color } from "@/lib/design/tokens";
import { toAdminUnits, type RawCollection } from "@/lib/geo/geography";
import type { PolygonalGeometry } from "@/lib/geo/pip";

/**
 * Static, server-rendered outline of the 20 Lagos LGAs shaded by SAMPLE zone. Real
 * boundaries, no JavaScript and no map library on the homepage. Equirectangular projection
 * with latitude scaling (cos 6.5 degrees), used only for drawing.
 */
export function ZoneSketch({ className = "" }: { className?: string }) {
  const fc = JSON.parse(readFileSync(join(process.cwd(), "public/geo/lagos-lgas.json"), "utf8")) as RawCollection;
  const units = toAdminUnits(fc);
  const k = Math.cos((6.5 * Math.PI) / 180);
  const minX = 2.69;
  const maxY = 6.71;
  const W = 640;
  const scale = W / ((4.38 - minX) * k);
  const H = (maxY - 6.37) * scale;
  const px = (lng: number) => ((lng - minX) * k * scale).toFixed(1);
  const py = (lat: number) => ((maxY - lat) * scale).toFixed(1);
  const path = (g: PolygonalGeometry) => {
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    return polys.map((poly) => poly.map((ring) => "M" + ring.filter((_, i) => i % 2 === 0 || i === ring.length - 1).map(([x, y]) => `${px(x)} ${py(y)}`).join("L") + "Z").join("")).join("");
  };
  const zoneIdx = (lgaId: string) => SAMPLE_ZONES.findIndex((z) => z.lgaIds.includes(lgaId));
  return (
    <svg viewBox={`0 0 ${W} ${H.toFixed(0)}`} role="img" aria-label="Outline of the 20 Lagos local government areas. Areas grouped into sample delivery zones are shaded; others are unshaded." className={className}>
      {units.map((u) => {
        const z = zoneIdx(u.id);
        return <path key={u.id} d={path(u.geometry)} fill={z >= 0 ? chart.zones[z] : color.paper2} fillOpacity={z >= 0 ? 0.55 : 1} stroke={color.ink} strokeOpacity={0.55} strokeWidth="0.8" />;
      })}
    </svg>
  );
}
