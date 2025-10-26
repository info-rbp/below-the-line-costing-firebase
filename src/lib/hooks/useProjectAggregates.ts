"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CostLineItem, MaterialCost, Milestone } from "@/types/domain";
import { clampToMonthStartEnd, monthKey, monthRangeInclusive } from "@/lib/calc/dates";
import {
  allocateMilestoneLinked,
  allocateRecurringMonthly,
  combineAllocations,
  rollupMilestoneTotals,
  type MilestoneTotals,
  type MonthlyAllocation,
} from "@/lib/calc/rollups";
import { safeAdd, safeMul, toCents } from "@/lib/calc/money";

type MilestoneIndex = Record<
  string,
  Pick<Milestone, "id" | "name" | "code" | "parentId" | "sortIndex" | "startDate" | "endDate">
>;

type AggregateResult = {
  loading: boolean;
  milestoneIndex: MilestoneIndex;
  totalsByMilestoneId: Record<string, MilestoneTotals>;
  monthlyOutflows: Record<string, number>;
  projectTotals: MilestoneTotals;
  unassignedTotals: MilestoneTotals;
  costs: CostLineItem[];
  materials: MaterialCost[];
  milestones: Milestone[];
};

const defaultTotals: MilestoneTotals = { labour: 0, services: 0, equipment: 0, materials: 0, total: 0 };

const fallbackMonth = (months: string[]): string => {
  if (months.length > 0) return months[0];
  return monthKey(new Date());
};

export function useProjectAggregates(projectId: string | undefined): AggregateResult {
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [costs, setCosts] = useState<CostLineItem[]>([]);
  const [materials, setMaterials] = useState<MaterialCost[]>([]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    const readiness = { milestones: false, costs: false, materials: false };
    const checkReady = () => {
      if (readiness.milestones && readiness.costs && readiness.materials) {
        setLoading(false);
      }
    };

    const milestoneQuery = query(
      collection(db, "projects", projectId, "milestones"),
      orderBy("sortIndex", "asc")
    );
    const unsubMilestones = onSnapshot(milestoneQuery, (snapshot) => {
      setMilestones(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Milestone[]);
      readiness.milestones = true;
      checkReady();
    });

    const costsQuery = collection(db, "projects", projectId, "costLineItems");
    const unsubCosts = onSnapshot(costsQuery, (snapshot) => {
      setCosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as CostLineItem[]);
      readiness.costs = true;
      checkReady();
    });

    const materialsQuery = collection(db, "projects", projectId, "materialCosts");
    const unsubMaterials = onSnapshot(materialsQuery, (snapshot) => {
      setMaterials(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as MaterialCost[]);
      readiness.materials = true;
      checkReady();
    });

    return () => {
      unsubMilestones();
      unsubCosts();
      unsubMaterials();
    };
  }, [projectId]);

  const milestoneIndex = useMemo<MilestoneIndex>(() => {
    return milestones.reduce<MilestoneIndex>((acc, milestone) => {
      acc[milestone.id] = {
        id: milestone.id,
        name: milestone.name,
        code: milestone.code,
        parentId: milestone.parentId ?? null,
        sortIndex:
          typeof milestone.sortIndex === "number"
            ? milestone.sortIndex
            : Number((milestone.sortIndex as number | string | undefined) ?? 0),
        startDate: milestone.startDate,
        endDate: milestone.endDate,
      };
      return acc;
    }, {});
  }, [milestones]);

  const childrenByParent = useMemo(() => {
    return milestones.reduce<Record<string, string[]>>((acc, milestone) => {
      const parent = milestone.parentId ?? "root";
      acc[parent] = acc[parent] ? [...acc[parent], milestone.id] : [milestone.id];
      return acc;
    }, {});
  }, [milestones]);

  const descendantMap = useMemo(() => {
    const cache = new Map<string, string[]>();
    const walk = (id: string): string[] => {
      if (cache.has(id)) return cache.get(id)!;
      const children = childrenByParent[id] ?? [];
      const descendants = children.flatMap((childId) => [childId, ...walk(childId)]);
      cache.set(id, descendants);
      return descendants;
    };
    milestones.forEach((milestone) => {
      walk(milestone.id);
    });
    return cache;
  }, [childrenByParent, milestones]);

  const totalsByMilestoneId = useMemo(() => {
    const totals: Record<string, MilestoneTotals> = {};
    for (const milestone of milestones) {
      const descendants = descendantMap.get(milestone.id) ?? [];
      totals[milestone.id] = rollupMilestoneTotals(costs, materials, [milestone.id, ...descendants]);
    }
    totals.unassigned = rollupMilestoneTotals(costs, materials, []);
    return totals;
  }, [costs, materials, milestones, descendantMap]);

  const milestoneDates = useMemo(() => {
    return Object.entries(milestoneIndex).reduce<Record<string, { startDate?: string; endDate?: string }>>(
      (acc, [id, value]) => {
        acc[id] = { startDate: value.startDate, endDate: value.endDate };
        return acc;
      },
      {}
    );
  }, [milestoneIndex]);

  const dateWindow = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;
    const consider = (value?: string) => {
      if (!value) return;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return;
      if (!min || date < min) min = date;
      if (!max || date > max) max = date;
    };
    milestones.forEach((milestone) => {
      consider(milestone.startDate);
      consider(milestone.endDate);
    });
    costs.forEach((cost) => {
      consider(cost.startDate);
      consider(cost.endDate);
    });
    materials.forEach((material) => {
      consider(material.startDate);
      consider(material.endDate);
    });
    if (!min || !max) {
      const { start, end } = clampToMonthStartEnd(new Date(), new Date());
      min = start;
      max = end;
    }
    return monthRangeInclusive(min, max);
  }, [costs, materials, milestones]);

  const monthlyOutflows = useMemo(() => {
    const allocations: MonthlyAllocation[] = [];

    costs.forEach((cost) => {
      const amount = toCents(safeMul(cost.rate, cost.qty));
      if (!amount) return;
      if (cost.milestoneIds && cost.milestoneIds.length > 0) {
        const allocation = allocateMilestoneLinked(
          {
            costType: "milestone",
            unitPrice: Number(cost.rate ?? 0),
            qty: Number(cost.qty ?? 0),
            milestoneIds: cost.milestoneIds,
            startDate: cost.startDate,
            endDate: cost.endDate,
          },
          milestoneDates
        );
        allocations.push(allocation);
      } else {
        const key = (() => {
          if (cost.startDate) return monthKey(cost.startDate);
          if (cost.endDate) return monthKey(cost.endDate);
          return fallbackMonth(dateWindow);
        })();
        allocations.push({ [key]: amount });
      }
    });

    materials.forEach((material) => {
      if (material.costType === "monthly") {
        allocations.push(allocateRecurringMonthly(material, dateWindow));
        return;
      }
      if (material.costType === "milestone") {
        allocations.push(allocateMilestoneLinked(material, milestoneDates));
        return;
      }
      const amount = toCents(safeMul(material.unitPrice, material.qty));
      if (!amount) return;
      const key = (() => {
        if (material.startDate) return monthKey(material.startDate);
        if (material.endDate) return monthKey(material.endDate);
        return fallbackMonth(dateWindow);
      })();
      allocations.push({ [key]: amount });
    });

    return combineAllocations(allocations);
  }, [costs, materials, milestoneDates, dateWindow]);

  const assignedTotals = useMemo(() => {
    return rollupMilestoneTotals(costs, materials, Object.keys(milestoneIndex));
  }, [costs, materials, milestoneIndex]);

  const unassignedTotals = totalsByMilestoneId.unassigned ?? defaultTotals;

  const projectTotals = useMemo<MilestoneTotals>(() => {
    return {
      labour: safeAdd(assignedTotals.labour, unassignedTotals.labour),
      services: safeAdd(assignedTotals.services, unassignedTotals.services),
      equipment: safeAdd(assignedTotals.equipment, unassignedTotals.equipment),
      materials: safeAdd(assignedTotals.materials, unassignedTotals.materials),
      total: safeAdd(assignedTotals.total, unassignedTotals.total),
    };
  }, [assignedTotals, unassignedTotals]);

  return {
    loading,
    milestoneIndex,
    totalsByMilestoneId,
    monthlyOutflows,
    projectTotals,
    unassignedTotals,
    costs,
    materials,
    milestones,
  };
}
