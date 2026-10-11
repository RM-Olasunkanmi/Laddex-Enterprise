"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import type { LngLat } from "@/features/delivery/types";

import { resolveLocation } from "@/features/delivery/resolve";
import {
  loadStateLgas,
  loadStates,
  type AdminUnit,
} from "@/lib/geo/geography";
import { geometryCentroid } from "@/lib/geo/pip";

const PinMap = dynamic(() => import("./pin-map"), {
  ssr: false,
  loading: () => <div className="skel h-72 rounded-md sm:h-80" aria-busy="true" />,
});

export interface DeliveryAddress {
  stateId: string;
  stateName: string;
  lgaId: string;
  lgaName: string;
  street: string;
  landmark: string;
  notes: string;
  /** Where the order goes. The LGA centre until the customer shares a location or drops a pin. */
  position: LngLat | null;
  precision: "lga-centre" | "gps" | "map-pin" | null;
}

export const EMPTY_ADDRESS: DeliveryAddress = {
  stateId: "",
  stateName: "",
  lgaId: "",
  lgaName: "",
  street: "",
  landmark: "",
  notes: "",
  position: null,
  precision: null,
};

export type AddressErrors = Partial<Record<"state" | "lga" | "street", string>>;

const centreOf = (u: AdminUnit): LngLat => {
  const [lng, lat] = geometryCentroid(u.geometry);
  return { lng: Number(lng.toFixed(5)), lat: Number(lat.toFixed(5)) };
};

/**
 * Plain form first: state, local government area, street and landmark are enough to deliver.
 * Sharing the device location or dropping a map pin is optional and only loads when asked for.
 */
export function AddressFields({
  value,
  onChange,
  errors,
}: {
  value: DeliveryAddress;
  onChange: (next: DeliveryAddress) => void;
  errors: AddressErrors;
}) {
  const [states, setStates] = useState<AdminUnit[] | null>(null);
  const [lgas, setLgas] = useState<{ stateId: string; units: AdminUnit[] } | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [gps, setGps] = useState<"idle" | "busy" | string>("idle");
  const [showMap, setShowMap] = useState(value.precision === "map-pin");

  useEffect(() => {
    loadStates().then(setStates).catch(() => setGeoError(true));
  }, []);
  useEffect(() => {
    if (!value.stateId) return;
    let live = true;
    loadStateLgas(value.stateId)
      .then((units) => live && setLgas({ stateId: value.stateId, units }))
      .catch(() => live && setGeoError(true));
    return () => {
      live = false;
    };
  }, [value.stateId]);

  const sortedStates = useMemo(
    () => states?.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [states],
  );
  const currentLgas =
    lgas && lgas.stateId === value.stateId ? lgas.units : null;
  const sortedLgas = useMemo(
    () => currentLgas?.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [currentLgas],
  );

  const set = (patch: Partial<DeliveryAddress>) => onChange({ ...value, ...patch });

  const pickState = (id: string) => {
    const s = states?.find((x) => x.id === id);
    onChange({
      ...value,
      stateId: id,
      stateName: s?.name ?? "",
      lgaId: "",
      lgaName: "",
      position: null,
      precision: null,
    });
  };
  const pickLga = (id: string) => {
    const l = currentLgas?.find((x) => x.id === id);
    if (!l) return set({ lgaId: "", lgaName: "", position: null, precision: null });
    set({ lgaId: id, lgaName: l.name, position: centreOf(l), precision: "lga-centre" });
  };

  /** A point from GPS or the map: resolve its state and LGA and fill the selects to match. */
  const placePoint = async (p: LngLat, precision: "gps" | "map-pin") => {
    if (!states) return;
    const base = resolveLocation(p, states);
    if (!base.stateId) {
      setGps("That location is outside Nigeria. Choose your state and area instead.");
      return;
    }
    const units = await loadStateLgas(base.stateId).catch(() => null);
    const r = resolveLocation(p, states, units);
    if (units) setLgas({ stateId: base.stateId, units });
    onChange({
      ...value,
      stateId: base.stateId,
      stateName: base.stateName ?? "",
      lgaId: r.lgaId ?? "",
      lgaName: r.lgaName ?? "",
      position: p,
      precision,
    });
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setGps("This browser cannot share your location. Choose your state and area instead.");
      return;
    }
    setGps("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps("idle");
        void placePoint(
          {
            lng: Number(pos.coords.longitude.toFixed(5)),
            lat: Number(pos.coords.latitude.toFixed(5)),
          },
          "gps",
        );
      },
      (err) =>
        setGps(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was refused. That is fine: choose your state and area below."
            : "Your location could not be read. Choose your state and area below.",
        ),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const lgaUnit = currentLgas?.find((l) => l.id === value.lgaId);
  const stateUnit = states?.find((s) => s.id === value.stateId);
  const box = (lgaUnit ?? stateUnit)?.bbox;
  const mapBounds: [[number, number], [number, number]] | null = box
    ? [
        [box[0], box[1]],
        [box[2], box[3]],
      ]
    : null;

  const err = (id: keyof AddressErrors) =>
    errors[id] ? (
      <p id={`addr-${id}-err`} className="mt-1 text-sm text-danger">
        {errors[id]}
      </p>
    ) : null;
  const aria = (id: keyof AddressErrors) => ({
    "aria-invalid": !!errors[id] || undefined,
    "aria-describedby": errors[id] ? `addr-${id}-err` : undefined,
  });

  return (
    <div className="space-y-5">
      {geoError && (
        <p className="rounded-md bg-warning-tint px-3 py-2 text-sm text-warning" role="alert">
          The list of states and areas could not be loaded. Check your
          connection and reload the page.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="addr-state" className="label">
            State
          </label>
          <select
            id="addr-state"
            className="field"
            value={value.stateId}
            disabled={!sortedStates}
            onChange={(e) => pickState(e.target.value)}
            autoComplete="address-level1"
            {...aria("state")}
          >
            <option value="">{sortedStates ? "Choose a state" : "Loading states…"}</option>
            {sortedStates?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {err("state")}
        </div>
        <div>
          <label htmlFor="addr-lga" className="label">
            Local government area
          </label>
          <select
            id="addr-lga"
            className="field"
            value={value.lgaId}
            disabled={!sortedLgas}
            onChange={(e) => pickLga(e.target.value)}
            autoComplete="address-level2"
            {...aria("lga")}
          >
            <option value="">
              {!value.stateId
                ? "Choose a state first"
                : sortedLgas
                  ? "Choose your area"
                  : "Loading areas…"}
            </option>
            {sortedLgas?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          {err("lga")}
        </div>
      </div>

      <div>
        <label htmlFor="addr-street" className="label">
          House number and street
        </label>
        <input
          id="addr-street"
          className="field"
          value={value.street}
          onChange={(e) => set({ street: e.target.value })}
          autoComplete="address-line1"
          placeholder="e.g. 12 Adeola Street, Ikota estate"
          {...aria("street")}
        />
        {err("street")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="addr-landmark" className="label">
            Nearest landmark <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <input
            id="addr-landmark"
            className="field"
            value={value.landmark}
            onChange={(e) => set({ landmark: e.target.value })}
            placeholder="e.g. opposite the Total filling station"
          />
        </div>
        <div>
          <label htmlFor="addr-notes" className="label">
            Notes for the rider <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <input
            id="addr-notes"
            className="field"
            value={value.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="e.g. call when you reach the gate"
          />
        </div>
      </div>

      <div className="rounded-md border border-line bg-paper-2/60 p-4">
        <p className="text-sm font-semibold">Help the rider find you (optional)</p>
        <p className="mt-1 text-sm text-ink-2">
          {value.precision === "gps"
            ? "Using your device location."
            : value.precision === "map-pin"
              ? "Using the pin you placed on the map."
              : "We will use the centre of your area plus the address above."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-line btn-sm min-h-11"
            onClick={locate}
            disabled={gps === "busy" || !states}
          >
            {gps === "busy" ? "Finding you…" : "Use my current location"}
          </button>
          <button
            type="button"
            className="btn btn-line btn-sm min-h-11"
            onClick={() => setShowMap((s) => !s)}
            disabled={!mapBounds}
            aria-expanded={showMap}
            aria-controls="pin-map"
          >
            {showMap ? "Hide map" : "Place a pin on the map"}
          </button>
        </div>
        {!mapBounds && (
          <p className="hint mt-2">Choose your state to use the map.</p>
        )}
        {gps !== "idle" && gps !== "busy" && (
          <p className="mt-2 text-sm text-ink-2" role="status">
            {gps}
          </p>
        )}
        {showMap && mapBounds && (
          <div id="pin-map" className="mt-4">
            <PinMap
              key={value.stateId}
              bounds={mapBounds}
              position={value.position}
              onPin={(p) => void placePoint(p, "map-pin")}
            />
            <p className="hint mt-2">
              Tap the map to place your pin, then drag it to adjust. The map
              uses more mobile data than the form.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
