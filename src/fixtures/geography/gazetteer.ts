/**
 * Approximate centres of the 36 state capitals, Abuja and a few large markets, used when live
 * address search is unavailable. These are locality-level positions (about 1 to 3 km accuracy),
 * never street addresses.
 */
export interface GazetteerEntry {
  name: string;
  /** State id as used in the boundary files. */
  stateId: string;
  lng: number;
  lat: number;
  /** True for the state capital (also used as a demand hotspot by the synthetic orders). */
  capital?: boolean;
}

export const GAZETTEER: GazetteerEntry[] = [
  { name: "Umuahia", stateId: "abia", lng: 7.49, lat: 5.525, capital: true },
  { name: "Aba", stateId: "abia", lng: 7.3667, lat: 5.1066 },
  { name: "Yola", stateId: "adamawa", lng: 12.4954, lat: 9.2035, capital: true },
  { name: "Uyo", stateId: "akwa-ibom", lng: 7.9128, lat: 5.0377, capital: true },
  { name: "Awka", stateId: "anambra", lng: 7.07, lat: 6.21, capital: true },
  { name: "Onitsha", stateId: "anambra", lng: 6.7857, lat: 6.1498 },
  { name: "Nnewi", stateId: "anambra", lng: 6.9167, lat: 6.0167 },
  { name: "Bauchi", stateId: "bauchi", lng: 9.8442, lat: 10.3158, capital: true },
  { name: "Yenagoa", stateId: "bayelsa", lng: 6.2676, lat: 4.9267, capital: true },
  { name: "Makurdi", stateId: "benue", lng: 8.5213, lat: 7.7337, capital: true },
  { name: "Maiduguri", stateId: "borno", lng: 13.15, lat: 11.8333, capital: true },
  { name: "Calabar", stateId: "cross-river", lng: 8.3417, lat: 4.9757, capital: true },
  { name: "Asaba", stateId: "delta", lng: 6.735, lat: 6.198, capital: true },
  { name: "Warri", stateId: "delta", lng: 5.75, lat: 5.516 },
  { name: "Abakaliki", stateId: "ebonyi", lng: 8.1137, lat: 6.3249, capital: true },
  { name: "Benin City", stateId: "edo", lng: 5.6037, lat: 6.335, capital: true },
  { name: "Ado-Ekiti", stateId: "ekiti", lng: 5.2214, lat: 7.6211, capital: true },
  { name: "Enugu", stateId: "enugu", lng: 7.5464, lat: 6.4584, capital: true },
  { name: "Abuja", stateId: "fct", lng: 7.3986, lat: 9.0765, capital: true },
  { name: "Gombe", stateId: "gombe", lng: 11.1673, lat: 10.2897, capital: true },
  { name: "Owerri", stateId: "imo", lng: 7.0333, lat: 5.4836, capital: true },
  { name: "Dutse", stateId: "jigawa", lng: 9.3389, lat: 11.7561, capital: true },
  { name: "Kaduna", stateId: "kaduna", lng: 7.4165, lat: 10.5105, capital: true },
  { name: "Kano", stateId: "kano", lng: 8.592, lat: 12.0022, capital: true },
  { name: "Katsina", stateId: "katsina", lng: 7.6018, lat: 12.9908, capital: true },
  { name: "Birnin Kebbi", stateId: "kebbi", lng: 4.1975, lat: 12.4539, capital: true },
  { name: "Lokoja", stateId: "kogi", lng: 6.7333, lat: 7.8023, capital: true },
  { name: "Ilorin", stateId: "kwara", lng: 4.5421, lat: 8.4966, capital: true },
  { name: "Ikeja", stateId: "lagos", lng: 3.3515, lat: 6.6018, capital: true },
  { name: "Lekki", stateId: "lagos", lng: 3.4723, lat: 6.4474 },
  { name: "Ikorodu", stateId: "lagos", lng: 3.5105, lat: 6.6194 },
  { name: "Lafia", stateId: "nasarawa", lng: 8.5153, lat: 8.4939, capital: true },
  { name: "Minna", stateId: "niger", lng: 6.5569, lat: 9.6139, capital: true },
  { name: "Abeokuta", stateId: "ogun", lng: 3.3619, lat: 7.1475, capital: true },
  { name: "Akure", stateId: "ondo", lng: 5.2058, lat: 7.2571, capital: true },
  { name: "Osogbo", stateId: "osun", lng: 4.5418, lat: 7.7827, capital: true },
  { name: "Ibadan", stateId: "oyo", lng: 3.947, lat: 7.3775, capital: true },
  { name: "Jos", stateId: "plateau", lng: 8.8583, lat: 9.8965, capital: true },
  { name: "Port Harcourt", stateId: "rivers", lng: 7.0498, lat: 4.8156, capital: true },
  { name: "Sokoto", stateId: "sokoto", lng: 5.2476, lat: 13.0059, capital: true },
  { name: "Jalingo", stateId: "taraba", lng: 11.3596, lat: 8.8938, capital: true },
  { name: "Damaturu", stateId: "yobe", lng: 11.9608, lat: 11.747, capital: true },
  { name: "Gusau", stateId: "zamfara", lng: 6.6641, lat: 12.1704, capital: true },
];
