import type {
  GeoJSONSource,
  GeoJSONSourceSpecification,
  Map as MlMap,
  MapGeoJSONFeature,
  MapLayerMouseEvent,
} from "maplibre-gl";

import { mapByTheme } from "@/lib/design/tokens";

/** Map colours for the active theme, read when layers are added (the map is rebuilt on theme change). */
const mapTokens = {
  get v() {
    return mapByTheme[
      document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    ];
  },
};

export const LGA_SOURCE = "lgas";
export const STATE_SOURCE = "states";

type FC = Exclude<GeoJSONSourceSpecification["data"], string>;

/**
 * Adds an administrative-boundary source with fill, outline, hover and selected states.
 * Fill colour is data-driven from feature-state (`fill`), so statistics can recolour units
 * without rebuilding geometry. Features are keyed by their `id` property.
 */
export function addBoundaryLayers(
  map: MlMap,
  source: string,
  data: FC,
  opts: { beforeId?: string; fillOpacity?: number } = {},
) {
  if (map.getSource(source)) return;
  map.addSource(source, { type: "geojson", data, promoteId: "id" });
  const fillColor = [
    "coalesce",
    ["feature-state", "fill"],
    mapTokens.v.outsideFill,
  ] as unknown as string;
  map.addLayer(
    {
      id: `${source}-fill`,
      type: "fill",
      source,
      paint: {
        "fill-color": fillColor,
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          Math.min(1, (opts.fillOpacity ?? 0.7) + 0.2),
          opts.fillOpacity ?? 0.7,
        ] as unknown as number,
      },
    },
    opts.beforeId,
  );
  map.addLayer(
    {
      id: `${source}-line`,
      type: "line",
      source,
      paint: {
        "line-color": mapTokens.v.boundary,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8,
          0.6,
          12,
          1.2,
        ] as unknown as number,
        "line-opacity": 0.9,
      },
    },
    opts.beforeId,
  );
  map.addLayer({
    id: `${source}-selected`,
    type: "line",
    source,
    paint: {
      "line-color": mapTokens.v.selectLine,
      "line-width": 3,
      "line-opacity": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        1,
        0,
      ] as unknown as number,
    },
  });
}

export function setFeatureStates(
  map: MlMap,
  source: string,
  ids: string[],
  state: (id: string) => Record<string, unknown>,
) {
  if (!map.getSource(source)) return;
  for (const id of ids) map.setFeatureState({ source, id }, state(id));
}

export function updateSource(map: MlMap, source: string, data: FC) {
  (map.getSource(source) as GeoJSONSource | undefined)?.setData(data);
}

/** Hover with a pointer cursor and an `onFeature` callback for tooltips. Returns a cleanup. */
export function bindHover(
  map: MlMap,
  source: string,
  onHover: (id: string | null, e?: { x: number; y: number }) => void,
) {
  let hovered: string | null = null;
  const layer = `${source}-fill`;
  const move = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0] as MapGeoJSONFeature | undefined;
    const id = f ? String(f.id) : null;
    if (id !== hovered) {
      if (hovered)
        map.setFeatureState({ source, id: hovered }, { hover: false });
      if (id) map.setFeatureState({ source, id }, { hover: true });
      hovered = id;
    }
    map.getCanvas().style.cursor = id ? "pointer" : "";
    onHover(id, id ? { x: e.point.x, y: e.point.y } : undefined);
  };
  const leave = () => {
    if (hovered) map.setFeatureState({ source, id: hovered }, { hover: false });
    hovered = null;
    map.getCanvas().style.cursor = "";
    onHover(null);
  };
  map.on("mousemove", layer, move);
  map.on("mouseleave", layer, leave);
  return () => {
    map.off("mousemove", layer, move);
    map.off("mouseleave", layer, leave);
  };
}
