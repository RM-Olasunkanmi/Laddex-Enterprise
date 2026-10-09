/**
 * Approximate centroids of well-known Lagos localities, used when live address search is
 * unavailable. These are locality-level positions (about 1 km accuracy), never street addresses.
 */
export interface GazetteerEntry {
  name: string;
  area: string;
  lng: number;
  lat: number;
}

export const GAZETTEER: GazetteerEntry[] = [
  { name: "Ikeja", area: "Ikeja", lng: 3.3515, lat: 6.6018 },
  { name: "Maryland", area: "Kosofe", lng: 3.367, lat: 6.572 },
  { name: "Oshodi", area: "Oshodi-Isolo", lng: 3.343, lat: 6.555 },
  { name: "Mushin", area: "Mushin", lng: 3.35, lat: 6.5333 },
  { name: "Surulere", area: "Surulere", lng: 3.355, lat: 6.501 },
  { name: "Yaba", area: "Lagos Mainland", lng: 3.3711, lat: 6.5095 },
  { name: "Apapa", area: "Apapa", lng: 3.3594, lat: 6.4489 },
  { name: "Lagos Island", area: "Lagos Island", lng: 3.3958, lat: 6.4541 },
  { name: "Victoria Island", area: "Eti-Osa", lng: 3.4219, lat: 6.4281 },
  { name: "Ikoyi", area: "Eti-Osa", lng: 3.435, lat: 6.45 },
  { name: "Lekki Phase 1", area: "Eti-Osa", lng: 3.4723, lat: 6.4474 },
  { name: "Ajah", area: "Eti-Osa", lng: 3.5667, lat: 6.4667 },
  { name: "Agege", area: "Agege", lng: 3.321, lat: 6.618 },
  { name: "Egbeda", area: "Alimosho", lng: 3.2816, lat: 6.5886 },
  { name: "Ikotun", area: "Alimosho", lng: 3.245, lat: 6.55 },
  { name: "Festac Town", area: "Amuwo-Odofin", lng: 3.284, lat: 6.4672 },
  { name: "Ojo", area: "Ojo", lng: 3.1833, lat: 6.4667 },
  { name: "Ikorodu", area: "Ikorodu", lng: 3.5105, lat: 6.6194 },
  { name: "Epe", area: "Epe", lng: 3.9783, lat: 6.5841 },
  { name: "Badagry", area: "Badagry", lng: 2.881, lat: 6.415 },
];
