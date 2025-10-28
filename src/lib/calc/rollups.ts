import type { CostLineItem, MaterialCost } from "@/types/domain";
import { monthKey, monthRangeInclusive } from "./dates";
import { safeAdd, safeMul, toCents } from "./money";

type MilestoneLookup = Record<string, { startDate?: string; endDate?: string }>;

export type MilestoneTotals = {
  labour: number;
  services: number;
  equipment: number;
  materials: number;
  total: number;
};

export type MonthlyAllocation = Record<string, number>;

const intersects = (left: string[] | undefined, right: Set<string>, treatEmptyAsMatch: boolean) => {
  const ids = (left ?? []).filter(Boolean);
  if (ids.length === 0) {
    return treatEmptyAsMatch;
  }
  if (right.size === 0) {
    return false;
  }
  return ids.some((id) => right.has(id));
};

export const materialTotalInCents = (material: MaterialCost): number => {
  const base = toCents(safeMul(material.unitPrice, material.qty));
  if (material.costType === "monthly") {
    const months = monthRangeInclusive(material.startDate, material.endDate);
    const span = months.length || 1;
    return base * span;
  }
  return base;
};

export function rollupMilestoneTotals(
  projectCosts: CostLineItem[],
  materialCosts: MaterialCost[],
  milestoneIds: string[]
): MilestoneTotals {
  const targetSet = new Set(milestoneIds.filter(Boolean));
  const includeUnassigned = milestoneIds.length === 0;

  let labour = 0;
  let services = 0;
  let equipment = 0;
  let materials = 0;

  for (const cost of projectCosts) {
    if (!intersects(cost.milestoneIds, targetSet, includeUnassigned)) continue;
    const total = toCents(safeMul(cost.rate, cost.qty));
    if (!total) continue;
    if (cost.type === "labour") labour += total;
    if (cost.type === "service") services += total;
    if (cost.type === "equipment") equipment += total;
  }

  for (const material of materialCosts) {
    if (!intersects(material.milestoneIds, targetSet, includeUnassigned)) continue;
    materials += materialTotalInCents(material);
  }

  const total = labour + services + equipment + materials;
  return {
    labour,
    services,
    equipment,
    materials,
    total,
  };
}

export function allocateRecurringMonthly(
  cost: Pick<MaterialCost, "unitPrice" | "qty" | "startDate" | "endDate">,
  months: string[]
): MonthlyAllocation {
  const base = toCents(safeMul(cost.unitPrice, cost.qty));
  if (!base) return {};
  const span = monthRangeInclusive(cost.startDate, cost.endDate);
  const activeMonths = span.length > 0 ? span : months;
  if (!activeMonths || activeMonths.length === 0) {
    return {};
  }
  return activeMonths.reduce<MonthlyAllocation>((acc, month) => {
    if (months.length && !months.includes(month)) {
      return acc;
    }
    acc[month] = safeAdd(acc[month] ?? 0, base);
    return acc;
  }, {});
}

export function allocateMilestoneLinked(
  cost: Pick<MaterialCost, "unitPrice" | "qty" | "startDate" | "endDate" | "milestoneIds" | "costType">,
  milestoneDates: MilestoneLookup
): MonthlyAllocation {
  if (cost.costType !== "milestone") return {};
  const total = toCents(safeMul(cost.unitPrice, cost.qty));
  if (!total) return {};
  const ids = Array.from(new Set((cost.milestoneIds ?? []).filter(Boolean)));
  if (ids.length === 0) {
    const reference = cost.startDate ?? cost.endDate ?? new Date();
    try {
      return { [monthKey(reference)]: total };
    } catch {
      return {};
    }
  }
  const per = Math.floor(total / ids.length);
  let remainder = total - per * ids.length;
  return ids.reduce<MonthlyAllocation>((acc, id) => {
    const milestone = milestoneDates[id];
    const reference = milestone?.startDate ?? milestone?.endDate ?? cost.startDate ?? cost.endDate ?? new Date();
    let key: string;
    try {
      key = monthKey(reference);
    } catch {
      key = monthKey(new Date());
    }
    const amount = per + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    acc[key] = safeAdd(acc[key] ?? 0, amount);
    return acc;
  }, {});
}

export function combineAllocations(allocations: MonthlyAllocation[]): MonthlyAllocation {
  return allocations.reduce<MonthlyAllocation>((acc, allocation) => {
    for (const [month, value] of Object.entries(allocation)) {
      acc[month] = safeAdd(acc[month] ?? 0, value);
    }
    return acc;
  }, {});
}
