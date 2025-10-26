"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { PaymentSchedule, Project } from "@/types/domain";
import { getProject } from "@/lib/repo/projects";
import { useToast } from "@/components/Toast";
import { db } from "@/lib/firebase/client";
import { useProjectAggregates } from "@/lib/hooks/useProjectAggregates";
import { formatError } from "@/lib/errors/format";
import { safeAdd, safeMul, toCents } from "@/lib/calc/money";
import { allocateMilestoneLinked, allocateRecurringMonthly, combineAllocations, materialTotalInCents } from "@/lib/calc/rollups";
import { monthKey } from "@/lib/calc/dates";
import { ExecutiveSummary } from "@/features/report/ExecutiveSummary";
import { ReportFilters } from "@/features/report/ReportFilters";
import { createReportSnapshot } from "@/features/report/snapshots/createSnapshot";
import type { ExecutiveSummarySnapshot, ReportFiltersState } from "@/features/report/snapshots/types";
import type { CostLineItem } from "@/types/domain";
import "@/features/report/print.css";

const defaultFilters: ReportFiltersState = {
  includeMilestoneIds: [],
  excludeMilestoneIds: [],
  costCategories: ["Labour", "Services", "Equipment", "Materials"],
  monthRange: null,
};

type SnapshotRecord = ExecutiveSummarySnapshot & { id: string };

type ComputedData = {
  totals: { label: string; amount: number }[];
  totalCost: number;
  totalInvoiced: number;
  variance: number;
  milestoneCount: number;
  dateWindow: { start: string; end: string };
  peakMonth?: { month: string; amount: number } | null;
  monthlyOutflows: Record<string, number>;
  snapshotMonths: string[];
  payments: PaymentSchedule[];
  upcomingInvoices: { invoiceNo: string; invoiceDate: string }[];
  filtersSummary: string;
};

const costTypeMap: Record<CostLineItem["type"], "Labour" | "Services" | "Equipment"> = {
  labour: "Labour",
  service: "Services",
  equipment: "Equipment",
};

const toCsv = (filename: string, rows: string[][]) => {
  const csv = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function ExecutiveSummaryPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const { showError, showSuccess } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentSchedule[]>([]);
  const [filters, setFilters] = useState<ReportFiltersState>({
    ...defaultFilters,
    costCategories: [...defaultFilters.costCategories],
  });
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [snapshotSaving, setSnapshotSaving] = useState(false);

  const aggregates = useProjectAggregates(projectId);

  useEffect(() => {
    if (!projectId) return;
    setProjectLoading(true);
    getProject(projectId)
      .then(setProject)
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        showError(formatError(error));
      })
      .finally(() => setProjectLoading(false));
  }, [projectId, showError]);

  useEffect(() => {
    if (!projectId) return;
    const paymentsQuery = query(collection(db, "projects", projectId, "paymentSchedules"), orderBy("invoiceDate", "asc"));
    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      setPayments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as PaymentSchedule[]);
    });
    return () => unsubscribe();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const snapshotsQuery = query(collection(db, "projects", projectId, "reportSnapshots"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(snapshotsQuery, (snapshot) => {
      const records: SnapshotRecord[] = snapshot.docs.map((doc) => {
        const data = doc.data() as ExecutiveSummarySnapshot;
        return {
          id: doc.id,
          ...data,
          createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
        };
      });
      setSnapshots(records);
    });
    return () => unsubscribe();
  }, [projectId]);

  const milestoneMap = aggregates.milestoneIndex;

  const availableMonths = useMemo(() => Object.keys(aggregates.monthlyOutflows ?? {}), [aggregates.monthlyOutflows]);
  const monthPool = useMemo(
    () => (availableMonths.length ? availableMonths : [monthKey(new Date())]),
    [availableMonths]
  );

  const isMilestoneAllowed = useCallback(
    (milestoneId: string | undefined | null) => {
      if (!milestoneId) {
        return filters.includeMilestoneIds.length === 0;
      }
      if (filters.excludeMilestoneIds.includes(milestoneId)) {
        return false;
    }
    if (filters.includeMilestoneIds.length === 0) {
      return true;
    }
    if (filters.includeMilestoneIds.includes(milestoneId)) {
      return true;
    }
    let current = milestoneMap[milestoneId]?.parentId ?? null;
    while (current) {
      if (filters.includeMilestoneIds.includes(current)) {
        return true;
      }
      current = milestoneMap[current]?.parentId ?? null;
    }
    return false;
    },
    [filters.excludeMilestoneIds, filters.includeMilestoneIds, milestoneMap]
  );

  const filteredCosts = useMemo(() => {
    return aggregates.costs.filter((cost) => {
      const category = costTypeMap[cost.type];
      if (!filters.costCategories.includes(category)) {
        return false;
      }
      const ids = cost.milestoneIds && cost.milestoneIds.length > 0 ? cost.milestoneIds : ["__unassigned__"];
      return ids.some((id) => (id === "__unassigned__" ? filters.includeMilestoneIds.length === 0 : isMilestoneAllowed(id)));
    });
  }, [aggregates.costs, filters.costCategories, filters.includeMilestoneIds, isMilestoneAllowed]);

  const filteredMaterials = useMemo(() => {
    return aggregates.materials.filter((material) => {
      if (!filters.costCategories.includes("Materials")) {
        return false;
      }
      const ids = material.milestoneIds && material.milestoneIds.length > 0 ? material.milestoneIds : ["__unassigned__"];
      return ids.some((id) => (id === "__unassigned__" ? filters.includeMilestoneIds.length === 0 : isMilestoneAllowed(id)));
    });
  }, [aggregates.materials, filters.costCategories, filters.includeMilestoneIds, isMilestoneAllowed]);

  const totalsByMilestone = useMemo(() => {
    const totals = new Map<string, { labour: number; services: number; equipment: number; materials: number }>();

    const assign = (milestoneId: string, updater: (bucket: { labour: number; services: number; equipment: number; materials: number }) => void) => {
      if (milestoneId !== "unassigned" && !isMilestoneAllowed(milestoneId)) return;
      const current = totals.get(milestoneId) ?? { labour: 0, services: 0, equipment: 0, materials: 0 };
      updater(current);
      totals.set(milestoneId, current);
    };

    filteredCosts.forEach((cost) => {
      const amount = toCents(safeMul(cost.rate, cost.qty));
      if (!amount) return;
      const category = costTypeMap[cost.type];
      const ids = cost.milestoneIds && cost.milestoneIds.length > 0 ? cost.milestoneIds : filters.includeMilestoneIds.length === 0 ? ["unassigned"] : [];
      ids.forEach((id) => {
        if (!id) return;
        assign(id, (bucket) => {
          if (category === "Labour") bucket.labour += amount;
          if (category === "Services") bucket.services += amount;
          if (category === "Equipment") bucket.equipment += amount;
        });
      });
    });

    filteredMaterials.forEach((material) => {
      const amount = materialTotalInCents(material);
      const ids = material.milestoneIds && material.milestoneIds.length > 0 ? material.milestoneIds : filters.includeMilestoneIds.length === 0 ? ["unassigned"] : [];
      ids.forEach((id) => {
        if (!id) return;
        assign(id, (bucket) => {
          bucket.materials += amount;
        });
      });
    });

    return totals;
  }, [filteredCosts, filteredMaterials, filters.includeMilestoneIds, isMilestoneAllowed]);

  const filteredMonthlyOutflows = useMemo(() => {
    const allocations: Record<string, number>[] = [];
    const milestoneDates = Object.entries(milestoneMap).reduce<Record<string, { startDate?: string; endDate?: string }>>(
      (acc, [id, value]) => {
        acc[id] = { startDate: value.startDate, endDate: value.endDate };
        return acc;
      },
      {}
    );

    filteredCosts.forEach((cost) => {
      const amount = toCents(safeMul(cost.rate, cost.qty));
      if (!amount) return;
      const ids = cost.milestoneIds ?? [];
      if (ids.length) {
        const allowed = ids.filter((id) => isMilestoneAllowed(id));
        if (allowed.length === 0) return;
        allocations.push(
          allocateMilestoneLinked(
            {
              costType: "milestone",
              unitPrice: Number(cost.rate ?? 0),
              qty: Number(cost.qty ?? 0),
              milestoneIds: allowed,
              startDate: cost.startDate,
              endDate: cost.endDate,
            },
            milestoneDates
          )
        );
      } else if (filters.includeMilestoneIds.length === 0) {
        const key = monthKey(cost.startDate ?? cost.endDate ?? new Date());
        allocations.push({ [key]: amount });
      }
    });

    filteredMaterials.forEach((material) => {
      if (material.costType === "monthly") {
        allocations.push(allocateRecurringMonthly(material, monthPool));
      } else if (material.costType === "milestone") {
        const allowed = (material.milestoneIds ?? []).filter((id) => isMilestoneAllowed(id));
        if (allowed.length === 0 && material.milestoneIds?.length) {
          return;
        }
        allocations.push(
          allocateMilestoneLinked(
            {
              ...material,
              milestoneIds: allowed.length > 0 ? allowed : material.milestoneIds,
            },
            milestoneDates
          )
        );
      } else {
        const key = monthKey(material.startDate ?? material.endDate ?? new Date());
        allocations.push({ [key]: toCents(safeMul(material.unitPrice, material.qty)) });
      }
    });

    const combined = combineAllocations(allocations);

    if (filters.monthRange?.start || filters.monthRange?.end) {
      return Object.entries(combined).reduce<Record<string, number>>((acc, [month, value]) => {
        if (filters.monthRange?.start && month < filters.monthRange.start) return acc;
        if (filters.monthRange?.end && month > filters.monthRange.end) return acc;
        acc[month] = value;
        return acc;
      }, {});
    }

    return combined;
  }, [
    filteredCosts,
    filteredMaterials,
    filters.includeMilestoneIds,
    filters.monthRange,
    isMilestoneAllowed,
    milestoneMap,
    monthPool
  ]);

  const computedData = useMemo<ComputedData>(() => {
    const labour = filteredCosts
      .filter((cost) => cost.type === "labour")
      .reduce((sum, cost) => sum + toCents(safeMul(cost.rate, cost.qty)), 0);
    const services = filteredCosts
      .filter((cost) => cost.type === "service")
      .reduce((sum, cost) => sum + toCents(safeMul(cost.rate, cost.qty)), 0);
    const equipment = filteredCosts
      .filter((cost) => cost.type === "equipment")
      .reduce((sum, cost) => sum + toCents(safeMul(cost.rate, cost.qty)), 0);
    const materials = filteredMaterials.reduce((sum, material) => sum + materialTotalInCents(material), 0);
    const totalCost = labour + services + equipment + materials;

    const totals = [
      { label: "Labour", amount: labour },
      { label: "Services", amount: services },
      { label: "Equipment", amount: equipment },
      { label: "Materials", amount: materials },
    ].filter((row) => filters.costCategories.includes(row.label as ReportFiltersState["costCategories"][number]));

    const totalInvoiced = payments.reduce((sum, payment) => safeAdd(sum, toCents(payment.amount)), 0);
    const variance = totalInvoiced - totalCost;

    const milestoneCount = aggregates.milestones.length;
    const dates: string[] = [];
    if (project?.startDate) dates.push(project.startDate);
    if (project?.endDate) dates.push(project.endDate);
    aggregates.milestones.forEach((milestone) => {
      if (milestone.startDate) dates.push(milestone.startDate);
      if (milestone.endDate) dates.push(milestone.endDate);
    });
    const sortedDates = dates
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    const dateWindow = {
      start: sortedDates[0]?.toISOString().slice(0, 10) ?? "-",
      end: sortedDates[sortedDates.length - 1]?.toISOString().slice(0, 10) ?? "-",
    };

    const monthlyEntries = Object.entries(filteredMonthlyOutflows).sort(([a], [b]) => a.localeCompare(b));
    const nowKey = monthKey(new Date());
    const constrained = monthlyEntries.filter(([month]) => {
      if (filters.monthRange?.start && month < filters.monthRange.start) return false;
      if (filters.monthRange?.end && month > filters.monthRange.end) return false;
      return true;
    });
    const future = constrained.filter(([month]) => month >= nowKey);
    const snapshotMonths = (future.length > 0 ? future : constrained).slice(0, 6).map(([month]) => month);
    const peak = constrained.reduce<{ month: string; amount: number } | null>((max, [month, value]) => {
      if (!max || value > max.amount) {
        return { month, amount: value };
      }
      return max;
    }, null);

    const upcomingInvoices = payments
      .filter((payment) => {
        if (!payment.invoiceDate) return false;
        return payment.invoiceDate >= new Date().toISOString().slice(0, 10);
      })
      .slice(0, 3)
      .map((payment) => ({ invoiceNo: payment.invoiceNo, invoiceDate: payment.invoiceDate }));

    const filtersSummary = buildFiltersSummary(filters);

    return {
      totals,
      totalCost,
      totalInvoiced,
      variance,
      milestoneCount,
      dateWindow,
      peakMonth: peak,
      monthlyOutflows: Object.fromEntries(constrained),
      snapshotMonths,
      payments,
      upcomingInvoices,
      filtersSummary,
    };
  }, [
    totalsByMilestone,
    filters,
    payments,
    aggregates.milestones,
    project,
    filteredMonthlyOutflows,
    filteredCosts,
    filteredMaterials
  ]);

  const activeSnapshot = useMemo(() => snapshots.find((item) => item.id === activeSnapshotId) ?? null, [snapshots, activeSnapshotId]);

  const displayData: ComputedData = activeSnapshot
    ? {
        totals: activeSnapshot.totals,
        totalCost: activeSnapshot.totalCost,
        totalInvoiced: activeSnapshot.totalInvoiced,
        variance: activeSnapshot.variance,
        milestoneCount: activeSnapshot.milestoneCount,
        dateWindow: activeSnapshot.dateWindow,
        peakMonth: activeSnapshot.peakMonth,
        monthlyOutflows: activeSnapshot.monthlyOutflows,
        snapshotMonths: activeSnapshot.snapshotMonths,
        payments: activeSnapshot.payments.map((payment) => ({
          id: payment.invoiceNo,
          invoiceNo: payment.invoiceNo,
          invoiceDate: payment.invoiceDate,
          amount: payment.amount,
          milestoneIds: Array(payment.milestoneCount).fill(""),
          materialCostIds: Array(payment.materialCount).fill(""),
        })) as PaymentSchedule[],
        upcomingInvoices: activeSnapshot.upcomingInvoices,
        filtersSummary: buildFiltersSummary(activeSnapshot.filters),
      }
    : computedData;

  useEffect(() => {
    if (!activeSnapshot) return;
    setFilters(activeSnapshot.filters);
  }, [activeSnapshot]);

  const loading = projectLoading || aggregates.loading;

  if (!projectId) {
    return (
      <main className="container">
        <div className="card">
          <p>Missing project context.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container">
        <div className="card">
          <p>Loading executive summary…</p>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="container">
        <div className="card">
          <p>Project not found.</p>
        </div>
      </main>
    );
  }

  const handleFiltersChange = (next: ReportFiltersState) => {
    setActiveSnapshotId(null);
    setFilters(next);
  };

  const handleReset = () => {
    setActiveSnapshotId(null);
    setFilters({
      includeMilestoneIds: [],
      excludeMilestoneIds: [],
      costCategories: [...defaultFilters.costCategories],
      monthRange: null,
    });
  };

  const handleExportMilestones = () => {
    const rows = Array.from(totalsByMilestone.entries()).map(([id, totals]) => [
      id === "unassigned" ? "Unassigned" : milestoneMap[id]?.name || milestoneMap[id]?.code || id,
      (totals.labour / 100).toFixed(2),
      (totals.services / 100).toFixed(2),
      (totals.equipment / 100).toFixed(2),
      (totals.materials / 100).toFixed(2),
      ((totals.labour + totals.services + totals.equipment + totals.materials) / 100).toFixed(2),
    ]);
    toCsv("milestone-totals.csv", [["Milestone", "Labour", "Services", "Equipment", "Materials", "Total"], ...rows]);
  };

  const handleExportPayments = () => {
    const rows = displayData.payments.map((payment) => [
      payment.invoiceNo,
      payment.invoiceDate,
      String(payment.amount ?? 0),
      String(payment.milestoneIds?.length ?? 0),
      String(payment.materialCostIds?.length ?? 0),
    ]);
    toCsv("payment-schedule.csv", [["Invoice", "Date", "Amount", "Milestones", "Materials"], ...rows]);
  };

  const handleSnapshot = async () => {
    if (!projectId) return;
    setSnapshotSaving(true);
    try {
      const payload: ExecutiveSummarySnapshot = {
        filters,
        totals: computedData.totals,
        totalCost: computedData.totalCost,
        totalInvoiced: computedData.totalInvoiced,
        variance: computedData.variance,
        milestoneCount: computedData.milestoneCount,
        dateWindow: computedData.dateWindow,
        peakMonth: computedData.peakMonth,
        monthlyOutflows: computedData.monthlyOutflows,
        payments: payments.map((payment) => ({
          invoiceNo: payment.invoiceNo,
          invoiceDate: payment.invoiceDate,
          amount: payment.amount,
          milestoneCount: payment.milestoneIds?.length ?? 0,
          materialCount: payment.materialCostIds?.length ?? 0,
        })),
        upcomingInvoices: computedData.upcomingInvoices,
        snapshotMonths: computedData.snapshotMonths,
      };
      const id = await createReportSnapshot(projectId, payload);
      showSuccess(`Snapshot saved (${id})`);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError(formatError(error));
    } finally {
      setSnapshotSaving(false);
    }
  };

  return (
    <main className="container">
      <div className="card print-hidden">
        <h1 style={{ marginTop: 0 }}>Executive summary</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label htmlFor="snapshot-select" style={{ fontWeight: 600 }}>
            Report version
          </label>
          <select
            id="snapshot-select"
            value={activeSnapshotId ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              setActiveSnapshotId(value || null);
            }}
          >
            <option value="">Live data</option>
            {snapshots.map((snapshot) => (
              <option key={snapshot.id} value={snapshot.id}>
                {snapshot.createdAt.replace("T", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ReportFilters
        filters={filters}
        onChange={handleFiltersChange}
        milestones={aggregates.milestones}
        availableMonths={monthPool}
        onReset={handleReset}
        onCreateSnapshot={handleSnapshot}
        snapshotBusy={snapshotSaving}
      />

      <ExecutiveSummary
        project={project}
        loading={loading}
        totals={displayData.totals}
        totalCost={displayData.totalCost}
        totalInvoiced={displayData.totalInvoiced}
        variance={displayData.variance}
        milestoneCount={displayData.milestoneCount}
        dateWindow={displayData.dateWindow}
        peakMonth={displayData.peakMonth}
        payments={displayData.payments}
        upcomingInvoices={displayData.upcomingInvoices}
        monthlyOutflows={displayData.monthlyOutflows}
        snapshotMonths={displayData.snapshotMonths}
        onExportMilestonesCsv={handleExportMilestones}
        onExportPaymentsCsv={handleExportPayments}
        filtersSummary={displayData.filtersSummary}
        footerStamp={{
          generatedOn: new Date().toISOString().slice(0, 10),
          projectId,
          version: activeSnapshotId ?? "live",
        }}
      />
    </main>
  );
}

function buildFiltersSummary(filters: ReportFiltersState) {
  const parts: string[] = [];
  if (filters.includeMilestoneIds.length > 0) {
    parts.push(`Only: ${filters.includeMilestoneIds.length} milestone(s)`);
  }
  if (filters.excludeMilestoneIds.length > 0) {
    parts.push(`Excluded: ${filters.excludeMilestoneIds.length}`);
  }
  if (filters.costCategories.length < 4) {
    parts.push(`Categories: ${filters.costCategories.join(", ")}`);
  }
  if (filters.monthRange?.start || filters.monthRange?.end) {
    parts.push(`Months: ${(filters.monthRange?.start ?? "-")} → ${(filters.monthRange?.end ?? "-")}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "All project data";
}
