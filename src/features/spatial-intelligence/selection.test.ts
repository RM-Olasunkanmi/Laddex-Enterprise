import { describe, expect, it } from "vitest";

import { initial, reducer, type State } from "./state";

const step = (s: State, ...actions: Parameters<typeof reducer>[1][]) =>
  actions.reduce(reducer, s);

describe("linked selection reducer", () => {
  it("selecting a region keeps the active filters", () => {
    const filtered = step(initial, {
      type: "filters",
      patch: { segments: ["wholesale"], categories: ["palm-oil"] },
    });
    const s = step(
      filtered,
      { type: "scale", scale: "region" },
      { type: "selectUnit", unitId: "south-west" },
    );
    expect(s.selection).toEqual({
      scale: "region",
      unitId: "south-west",
      stateId: null,
      orderId: null,
    });
    expect(s.filters.segments).toEqual(["wholesale"]);
    expect(s.filters.categories).toEqual(["palm-oil"]);
  });

  it("changing filters or date range never clears the geographic selection", () => {
    const s = step(
      initial,
      { type: "selectUnit", unitId: "ikeja" },
      { type: "filters", patch: { from: "2026-08-01", to: "2026-08-31" } },
      { type: "filters", patch: { variantIds: ["po-5l"] } },
    );
    expect(s.selection.unitId).toBe("ikeja");
    expect(s.filters.from).toBe("2026-08-01");
  });

  it("selecting an order overlays the unit and deselecting restores the previous geographic context", () => {
    const withUnit = step(initial, { type: "selectUnit", unitId: "eti-osa" });
    const withOrder = step(withUnit, {
      type: "selectOrder",
      orderId: "LX-00042",
    });
    expect(withOrder.selection).toEqual({
      scale: "state",
      unitId: "eti-osa",
      stateId: null,
      orderId: "LX-00042",
    });
    const restored = step(withOrder, { type: "selectOrder", orderId: null });
    expect(restored.selection).toEqual({
      scale: "state",
      unitId: "eti-osa",
      stateId: null,
      orderId: null,
    });
  });

  it("selecting a different unit drops any selected order", () => {
    const s = step(
      initial,
      { type: "selectUnit", unitId: "ikeja" },
      { type: "selectOrder", orderId: "LX-00001" },
      { type: "selectUnit", unitId: "surulere" },
    );
    expect(s.selection).toEqual({
      scale: "state",
      unitId: "surulere",
      stateId: null,
      orderId: null,
    });
  });

  it("switching scale resets the unit because ids belong to one scale", () => {
    const s = step(
      initial,
      { type: "selectUnit", unitId: "lagos" },
      { type: "scale", scale: "region" },
    );
    expect(s.selection).toEqual({
      scale: "region",
      unitId: null,
      stateId: null,
      orderId: null,
    });
  });

  it("switching from a selected state to LGA scale carries the state across; drill sets it directly", () => {
    const a = step(
      initial,
      { type: "selectUnit", unitId: "oyo" },
      { type: "scale", scale: "lga" },
    );
    expect(a.selection).toEqual({
      scale: "lga",
      unitId: null,
      stateId: "oyo",
      orderId: null,
    });
    const b = step(initial, { type: "drill", stateId: "kano" });
    expect(b.selection).toEqual({
      scale: "lga",
      unitId: null,
      stateId: "kano",
      orderId: null,
    });
  });

  it("dropping to the analyst role removes order selection and order points", () => {
    const admin = step(
      initial,
      { type: "role", role: "admin" },
      { type: "layer", key: "orderPoints", on: true },
      { type: "selectOrder", orderId: "LX-00001" },
    );
    expect(admin.selection.orderId).toBe("LX-00001");
    const analyst = step(admin, { type: "role", role: "analyst" });
    expect(analyst.selection.orderId).toBeNull();
    expect(analyst.layers.orderPoints).toBe(false);
  });

  it("reset extent clears selection but keeps filters; reset all restores defaults but keeps role", () => {
    const s = step(
      initial,
      { type: "role", role: "admin" },
      { type: "filters", patch: { segments: ["retail"] } },
      { type: "selectUnit", unitId: "ikeja" },
      { type: "resetExtent" },
    );
    expect(s.selection.unitId).toBeNull();
    expect(s.filters.segments).toEqual(["retail"]);
    expect(s.resetToken).toBe(initial.resetToken + 1);
    const all = step(s, { type: "resetAll" });
    expect(all.filters).toEqual(initial.filters);
    expect(all.role).toBe("admin");
  });
});
