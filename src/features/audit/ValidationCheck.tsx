"use client";

import { useMemo, type CSSProperties } from "react";
import type { CostLineItem, MaterialCost, Milestone, PaymentSchedule } from "@/types/domain";

const modalStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
};

const panelStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "2rem",
  width: "min(640px, 90vw)",
  maxHeight: "80vh",
  overflowY: "auto",
};

type Props = {
  open: boolean;
  onClose: () => void;
  costs: CostLineItem[];
  materials: MaterialCost[];
  milestones: Milestone[];
  payments: PaymentSchedule[];
};

type Issue = {
  severity: "error" | "warning";
  message: string;
  reference?: string;
};

export function ValidationCheck({ open, onClose, costs, materials, milestones, payments }: Props) {
  const issues = useMemo<Issue[]>(() => {
    const findings: Issue[] = [];

    materials.forEach((material) => {
      if (material.costType === "monthly") {
        if (!material.startDate || !material.endDate) {
          findings.push({
            severity: "error",
            message: `Monthly material ${material.sku} is missing a start or end date`,
          });
        }
      }
      if (material.costType === "milestone" && (!material.milestoneIds || material.milestoneIds.length === 0)) {
        findings.push({
          severity: "error",
          message: `Milestone-linked material ${material.sku} has no milestones selected`,
        });
      }
    });

    milestones.forEach((milestone) => {
      if (milestone.startDate && milestone.endDate) {
        const start = new Date(milestone.startDate);
        const end = new Date(milestone.endDate);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
          findings.push({
            severity: "error",
            message: `Milestone ${milestone.name || milestone.code} ends before it starts`,
          });
        }
      }
    });

    payments.forEach((payment) => {
      const linkedMilestones = payment.milestoneIds ?? [];
      const linkedMaterials = payment.materialCostIds ?? [];
      if (linkedMilestones.length === 0 && linkedMaterials.length === 0) {
        findings.push({
          severity: "warning",
          message: `Payment ${payment.invoiceNo} is not linked to milestones or materials`,
        });
      }
    });

    costs.forEach((cost) => {
      if (cost.startDate && cost.endDate) {
        const start = new Date(cost.startDate);
        const end = new Date(cost.endDate);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
          findings.push({
            severity: "warning",
            message: `Cost ${cost.roleOrSKU} has an end date before the start date`,
          });
        }
      }
    });

    return findings;
  }, [costs, materials, milestones, payments]);

  if (!open) return null;

  const grouped = issues.reduce<Record<"error" | "warning", Issue[]>>(
    (acc, issue) => {
      acc[issue.severity].push(issue);
      return acc;
    },
    { error: [], warning: [] }
  );

  return (
    <div style={modalStyle} role="dialog" aria-modal>
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Validation results</h2>
          <button className="button-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {issues.length === 0 ? (
          <p style={{ marginTop: "1rem" }}>No validation issues found.</p>
        ) : (
          <div className="list-grid" style={{ marginTop: "1.5rem" }}>
            {grouped.error.length > 0 && (
              <section>
                <h3 style={{ color: "#b91c1c" }}>Errors</h3>
                <ul>
                  {grouped.error.map((issue, index) => (
                    <li key={`error-${index}`}>{issue.message}</li>
                  ))}
                </ul>
              </section>
            )}
            {grouped.warning.length > 0 && (
              <section>
                <h3 style={{ color: "#92400e" }}>Warnings</h3>
                <ul>
                  {grouped.warning.map((issue, index) => (
                    <li key={`warn-${index}`}>{issue.message}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
