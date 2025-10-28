"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { CostLineItem, MaterialCost, PaymentSchedule, Project } from "@/types/domain";
import { getProject } from "@/lib/repo/projects";
import { useToast } from "@/components/Toast";
import { db } from "@/lib/firebase/client";
import { useProjectAggregates } from "@/lib/hooks/useProjectAggregates";
import { formatCurrencyFromCents, formatCurrency } from "@/lib/calc/format";
import { MilestoneTotals } from "@/features/milestones";
import { PaymentPlan } from "@/features/payments/PaymentPlan";
import { PaymentSummary } from "@/features/payments/PaymentSummary";
import { CashflowChart } from "@/features/cashflow/CashflowChart";
import { RatesAudit } from "@/features/audit/RatesAudit";
import { ValidationCheck } from "@/features/audit/ValidationCheck";
import { safeMul, toCents } from "@/lib/calc/money";
import type { MilestoneTotals as Totals } from "@/lib/calc/rollups";
import { formatError } from "@/lib/errors/format";

const groupCosts = (
  costs: CostLineItem[],
  filter: string | null | undefined
): Record<string, CostLineItem[]> => {
  return costs.reduce<Record<string, CostLineItem[]>>((acc, cost) => {
    const ids = cost.milestoneIds && cost.milestoneIds.length > 0 ? cost.milestoneIds : ["unassigned"];
    ids.forEach((id) => {
      if (filter !== undefined) {
        if (filter === null && id !== "unassigned") return;
        if (typeof filter === "string" && id !== filter) return;
      }
      acc[id] = acc[id] ? [...acc[id], cost] : [cost];
    });
    return acc;
  }, {});
};

const groupMaterials = (
  materials: MaterialCost[],
  filter: string | null | undefined
): Record<string, MaterialCost[]> => {
  return materials.reduce<Record<string, MaterialCost[]>>((acc, material) => {
    const ids = material.milestoneIds && material.milestoneIds.length > 0 ? material.milestoneIds : ["unassigned"];
    ids.forEach((id) => {
      if (filter !== undefined) {
        if (filter === null && id !== "unassigned") return;
        if (typeof filter === "string" && id !== filter) return;
      }
      acc[id] = acc[id] ? [...acc[id], material] : [material];
    });
    return acc;
  }, {});
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const { showError } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentSchedule[]>([]);
  const [validationOpen, setValidationOpen] = useState(false);
  const [milestoneFilter, setMilestoneFilter] = useState<string | null | undefined>(undefined);

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
    const paymentsQuery = query(
      collection(db, "projects", projectId, "paymentSchedules"),
      orderBy("invoiceDate", "asc")
    );
    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      setPayments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as PaymentSchedule[]);
    });
    return () => unsubscribe();
  }, [projectId]);

  const activeMilestone = milestoneFilter === undefined ? undefined : milestoneFilter;

  const handleMilestoneSelect = (id: string | null) => {
    setMilestoneFilter((current) => {
      const next = id ?? null;
      if (current === next) return undefined;
      return next;
    });
  };

  const groupedCosts = useMemo(
    () => groupCosts(aggregates.costs, milestoneFilter),
    [aggregates.costs, milestoneFilter]
  );
  const groupedMaterials = useMemo(
    () => groupMaterials(aggregates.materials, milestoneFilter),
    [aggregates.materials, milestoneFilter]
  );

  const sortKeys = useCallback(
    (keys: string[]) =>
      keys.sort((a, b) => {
        if (a === "unassigned") return 1;
        if (b === "unassigned") return -1;
        const left = aggregates.milestoneIndex[a]?.sortIndex ?? 0;
        const right = aggregates.milestoneIndex[b]?.sortIndex ?? 0;
        if (left !== right) return (Number(left) || 0) - (Number(right) || 0);
        const leftName = aggregates.milestoneIndex[a]?.name || aggregates.milestoneIndex[a]?.code || a;
        const rightName = aggregates.milestoneIndex[b]?.name || aggregates.milestoneIndex[b]?.code || b;
        return leftName.localeCompare(rightName);
      }),
    [aggregates.milestoneIndex]
  );

  const costGroups = useMemo(() => sortKeys(Object.keys(groupedCosts)), [groupedCosts, sortKeys]);
  const materialGroups = useMemo(() => sortKeys(Object.keys(groupedMaterials)), [groupedMaterials, sortKeys]);

  const filterLabel = useMemo(() => {
    if (milestoneFilter === undefined) return "All milestones";
    if (milestoneFilter === null) return "Unassigned items";
    const value = aggregates.milestoneIndex[milestoneFilter];
    return value?.name || value?.code || milestoneFilter;
  }, [milestoneFilter, aggregates.milestoneIndex]);

  const timeline = useMemo(() => {
    const dates: string[] = [];
    if (project?.startDate) dates.push(project.startDate);
    if (project?.endDate) dates.push(project.endDate);
    aggregates.milestones.forEach((milestone) => {
      if (milestone.startDate) dates.push(milestone.startDate);
      if (milestone.endDate) dates.push(milestone.endDate);
    });
    if (dates.length === 0) return { start: "-", end: "-" };
    const sorted = dates
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    if (sorted.length === 0) return { start: "-", end: "-" };
    return {
      start: sorted[0].toISOString().slice(0, 10),
      end: sorted[sorted.length - 1].toISOString().slice(0, 10),
    };
  }, [project, aggregates.milestones]);

  const isLoading = projectLoading || aggregates.loading;

  if (!projectId) {
    return (
      <main className="container">
        <div className="card">
          <p>Missing project context.</p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="container">
        <div className="card">
          <p>Loading project...</p>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="container">
        <div className="card">
          <h1>Project not found</h1>
        </div>
      </main>
    );
  }

  const totals: Totals = aggregates.projectTotals ?? { labour: 0, services: 0, equipment: 0, materials: 0, total: 0 };

  return (
    <main className="container">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>{project.name}</h1>
            <p>
              Client: <strong>{project.clientName}</strong>
            </p>
            <p>
              Status: <strong>{project.status ?? "draft"}</strong>
            </p>
            <p>
              Timeline: {timeline.start} to {timeline.end}
            </p>
            <p>Milestones: {aggregates.milestones.length}</p>
          </div>
          <div
            style={{
              textAlign: "right",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              alignItems: "flex-end",
            }}
          >
            <div>
              <p style={{ margin: 0 }}>Total: {formatCurrencyFromCents(totals.total)}</p>
              <p style={{ margin: 0 }}>Labour: {formatCurrencyFromCents(totals.labour)}</p>
              <p style={{ margin: 0 }}>Services: {formatCurrencyFromCents(totals.services)}</p>
              <p style={{ margin: 0 }}>Equipment: {formatCurrencyFromCents(totals.equipment)}</p>
              <p style={{ margin: 0 }}>Materials: {formatCurrencyFromCents(totals.materials)}</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <a className="button-secondary" href={`/projects/${projectId}/executive-summary`}>
                Executive summary
              </a>
              <button className="button-secondary" onClick={() => setValidationOpen(true)}>
                Validate data
              </button>
            </div>
          </div>
        </div>
      </div>

      <MilestoneTotals
        milestones={aggregates.milestones}
        totalsById={aggregates.totalsByMilestoneId}
        onSelect={handleMilestoneSelect}
        activeMilestoneId={activeMilestone}
      />

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Cost build</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="badge">{filterLabel}</span>
            {milestoneFilter !== undefined && (
              <button className="button-ghost" onClick={() => setMilestoneFilter(undefined)}>
                Clear filter
              </button>
            )}
          </div>
        </div>
        {costGroups.length === 0 ? (
          <p>No labour, service, or equipment costs.</p>
        ) : (
          <div className="list-grid" style={{ marginTop: "1rem" }}>
            {costGroups.map((id) => {
              const items = groupedCosts[id];
              const label =
                id === "unassigned"
                  ? "Unassigned"
                  : aggregates.milestoneIndex[id]?.name || aggregates.milestoneIndex[id]?.code || id;
              return (
                <div key={id} className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
                  <h3>{label}</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Role / SKU</th>
                        <th>Rate</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.type}</td>
                          <td>{item.roleOrSKU}</td>
                          <td>{formatCurrency(Number(item.rate ?? 0))}</td>
                          <td>{item.qty ?? 0}</td>
                          <td>{formatCurrencyFromCents(toCents(safeMul(item.rate, item.qty)))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Materials</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="badge">{filterLabel}</span>
            {milestoneFilter !== undefined && (
              <button className="button-ghost" onClick={() => setMilestoneFilter(undefined)}>
                Clear filter
              </button>
            )}
          </div>
        </div>
        {materialGroups.length === 0 ? (
          <p>No materials captured.</p>
        ) : (
          <div className="list-grid" style={{ marginTop: "1rem" }}>
            {materialGroups.map((id) => {
              const items = groupedMaterials[id];
              const label =
                id === "unassigned"
                  ? "Unassigned"
                  : aggregates.milestoneIndex[id]?.name || aggregates.milestoneIndex[id]?.code || id;
              return (
                <div key={id} className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
                  <h3>{label}</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Cost type</th>
                        <th>Unit price</th>
                        <th>Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.sku}</td>
                          <td>{item.costType}</td>
                          <td>{formatCurrency(Number(item.unitPrice ?? 0))}</td>
                          <td>{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PaymentPlan
        projectId={projectId}
        milestones={aggregates.milestones}
        materials={aggregates.materials}
        projectTotals={totals}
        payments={payments}
      />

      <PaymentSummary payments={payments} projectTotals={totals} />
      <CashflowChart monthlyOutflows={aggregates.monthlyOutflows} />
      <RatesAudit costs={aggregates.costs} materials={aggregates.materials} />

      <ValidationCheck
        open={validationOpen}
        onClose={() => setValidationOpen(false)}
        costs={aggregates.costs}
        materials={aggregates.materials}
        milestones={aggregates.milestones}
        payments={payments}
      />
    </main>
  );
}
