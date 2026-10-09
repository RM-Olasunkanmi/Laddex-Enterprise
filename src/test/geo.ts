import { readFileSync } from "node:fs";

import {
  toAdminUnits,
  type AdminUnit,
  type RawCollection,
} from "@/lib/geo/geography";

const read = (f: string) =>
  JSON.parse(readFileSync(`public/geo/${f}`, "utf8")) as RawCollection;

let lgas: AdminUnit[] | null = null;
let states: AdminUnit[] | null = null;

/** Loads the real shipped boundary files from disk for tests. */
export const testLgas = () => (lgas ??= toAdminUnits(read("lagos-lgas.json")));
export const testStates = () =>
  (states ??= toAdminUnits(read("ng-states.json")));
