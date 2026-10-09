import { readFileSync } from "node:fs";

import {
  toAdminUnits,
  type AdminUnit,
  type RawCollection,
} from "@/lib/geo/geography";

const read = (f: string) =>
  JSON.parse(readFileSync(`public/geo/${f}`, "utf8")) as RawCollection;

let states: AdminUnit[] | null = null;
const lgaCache = new Map<string, AdminUnit[]>();

/** Loads the real shipped boundary files from disk for tests. */
export const testStates = () =>
  (states ??= toAdminUnits(read("ng-states.json")));
export const testLgas = (stateId: string) => {
  let l = lgaCache.get(stateId);
  if (!l)
    lgaCache.set(stateId, (l = toAdminUnits(read(`lga/${stateId}.json`))));
  return l;
};
