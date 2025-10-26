import { describe, expect, it } from "vitest";
import type { CostLineItem, MaterialCost } from "@/types/domain";
import {
  allocateMilestoneLinked,
  allocateRecurringMonthly,
  combineAllocations,
  rollupMilestoneTotals,
} from "./rollups";

describe("rollup helpers", () => {
  const costs: CostLineItem[] = [
    {
      id: "c1",
      type: "labour",
      roleOrSKU: "Producer",
      rate: 800,
      qty: 2,
      unit: "day",
      milestoneIds: ["m1"],
      createdAt: "",
    },
    {
      id: "c2",
      type: "service",
      roleOrSKU: "Sound",
      rate: 500,
      qty: 1,
      unit: "day",
      milestoneIds: ["m2"],
      createdAt: "",
    },
  ];

  const materials: MaterialCost[] = [
    {
      id: "m1",
      sku: "CAM-1",
      unitPrice: 1000,
      qty: 1,
      costType: "one-time",
      milestoneIds: ["m1"],
      createdAt: "",
    },
    {
      id: "m2",
      sku: "STO-1",
      unitPrice: 100,
      qty: 1,
      costType: "monthly",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
      milestoneIds: [],
      createdAt: "",
    },
  ];

  it("rolls up totals by milestone", () => {
    const totals = rollupMilestoneTotals(costs, materials, ["m1"]);
    expect(totals.labour).toBe(160000);
    expect(totals.materials).toBe(100000);
    expect(totals.total).toBe(260000);
  });

  it("allocates recurring monthly costs", () => {
    const allocation = allocateRecurringMonthly(materials[1], ["2024-01", "2024-02", "2024-03"]);
    expect(allocation).toEqual({
      "2024-01": 10000,
      "2024-02": 10000,
      "2024-03": 10000,
    });
  });

  it("allocates milestone linked materials", () => {
    const allocation = allocateMilestoneLinked(
      {
        costType: "milestone",
        unitPrice: 900,
        qty: 1,
        milestoneIds: ["m1", "m2"],
        startDate: "2024-01-01",
      },
      {
        m1: { startDate: "2024-01-15" },
        m2: { startDate: "2024-02-01" },
      }
    );
    expect(allocation["2024-01"]).toBe(45000);
    expect(allocation["2024-02"]).toBe(45000);
  });

  it("combines monthly allocations", () => {
    const combined = combineAllocations([
      { "2024-01": 100, "2024-02": 200 },
      { "2024-02": 300 },
    ]);
    expect(combined).toEqual({ "2024-01": 100, "2024-02": 500 });
  });
});
