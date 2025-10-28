"use client";

import { useEffect, useRef } from "react";
import type { PaymentSchedule, Project } from "@/types/domain";
import { formatCurrency, formatCurrencyFromCents } from "@/lib/calc/format";
import type { MilestoneTotals } from "@/lib/calc/rollups";
import type { MilestoneIndex } from "@/lib/hooks/useProjectAggregates";
import { exportExecutiveSummaryPdf, registerExportContainer, triggerPrint } from "./ExportPDF";
import { BreakdownTable } from "./components/BreakdownTable";
import { CashflowMiniChart } from "./components/CashflowMiniChart";
import { InvoiceStatus } from "./components/InvoiceStatus";
import { KPICard } from "./components/KPICard";

type BreakdownRow = {
  label: string;
  amount: number;
};

export interface ExecutiveSummaryProps {
  project: Project;
  loading: boolean;
  totals: BreakdownRow[];
  totalCost: number;
  totalInvoiced: number;
  variance: number;
  milestoneCount: number;
  dateWindow: { start: string; end: string };
  peakMonth?: { month: string; amount: number } | null;
  payments: PaymentSchedule[];
  upcomingInvoices: { invoiceNo: string; invoiceDate: string }[];
  monthlyOutflows: Record<string, number>;
  snapshotMonths: string[];
  onExportMilestonesCsv: () => void;
  onExportPaymentsCsv: () => void;
  filtersSummary?: string;
  footerStamp: { generatedOn: string; projectId: string; version?: string };
  milestoneTotals: Record<string, MilestoneTotals>;
  milestoneIndex: MilestoneIndex;
  projectTotals: MilestoneTotals;
}

export function ExecutiveSummary({
  project,
  loading,
  totals,
  totalCost,
  totalInvoiced,
  variance,
  milestoneCount,
  dateWindow,
  peakMonth,
  payments,
  upcomingInvoices,
  monthlyOutflows,
  snapshotMonths,
  onExportMilestonesCsv,
  onExportPaymentsCsv,
  filtersSummary,
  footerStamp,
  milestoneTotals: _milestoneTotals,
  milestoneIndex: _milestoneIndex,
  projectTotals: _projectTotals,
}: ExecutiveSummaryProps) {
  void _milestoneTotals;
  void _milestoneIndex;
  void _projectTotals;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerExportContainer(containerRef.current);
  }, []);

  const headlineTotals = totals.filter((row) =>
    ["Labour", "Services", "Equipment", "Materials"].includes(row.label)
  );

  return (
    <section className="card" ref={containerRef} aria-busy={loading} aria-live="polite">
      <div className="print-hidden" style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>{project.name}</h1>
          <p style={{ margin: 0 }}>Client: {project.clientName}</p>
          <p style={{ margin: 0 }}>Status: {project.status ?? "draft"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button className="button-secondary" onClick={onExportMilestonesCsv}>
            Export milestone CSV
          </button>
          <button className="button-secondary" onClick={onExportPaymentsCsv}>
            Export payments CSV
          </button>
          <button className="button-secondary" onClick={exportExecutiveSummaryPdf}>
            Export PDF
          </button>
          <button className="button-primary" onClick={triggerPrint}>
            Print
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1.5rem", marginTop: "1.5rem" }}>
        <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border-muted)" }}>
          <h2 style={{ marginTop: 0 }}>Executive summary</h2>
          <p style={{ margin: 0 }}>
            {dateWindow.start} → {dateWindow.end} · {milestoneCount} milestones tracked
          </p>
          {peakMonth && (
            <p style={{ margin: 0, marginTop: "0.5rem" }}>
              Peak outflow: {peakMonth.month} ({formatCurrencyFromCents(peakMonth.amount)})
            </p>
          )}
          {filtersSummary && (
            <p style={{ marginTop: "0.75rem", color: "var(--text-muted)" }}>Filters: {filtersSummary}</p>
          )}
        </div>

        <div className="kpi-grid">
          <KPICard label="Total project cost" value={totalCost} />
          {headlineTotals.map((row) => (
            <KPICard key={row.label} label={row.label} value={row.amount} />
          ))}
          <KPICard label="Total invoiced" value={totalInvoiced} />
          <KPICard
            label="Variance"
            value={variance}
            status={variance === 0 ? "success" : variance < 0 ? "warning" : "error"}
          />
        </div>

        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <BreakdownTable rows={totals} caption="Cost breakdown" />
          <InvoiceStatus
            totalInvoiced={totalInvoiced}
            totalCost={totalCost}
            variance={variance}
            upcomingInvoices={upcomingInvoices}
          />
        </div>

        <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border-muted)" }}>
          <h3>Cash flow snapshot</h3>
          <CashflowMiniChart data={monthlyOutflows} months={snapshotMonths} />
        </div>

        <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border-muted)" }}>
          <h3>Invoices</h3>
          {payments.length === 0 ? (
            <p>No invoices recorded.</p>
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Invoice</th>
                    <th scope="col">Date</th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Amount
                    </th>
                    <th scope="col">Milestones</th>
                    <th scope="col">Materials</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <th scope="row">{payment.invoiceNo}</th>
                      <td>{payment.invoiceDate}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(payment.amount)}</td>
                      <td>{payment.milestoneIds?.length ?? 0}</td>
                      <td>{payment.materialCostIds?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="print-footer print-visible">
        Generated {footerStamp.generatedOn} · Project {footerStamp.projectId}
        {footerStamp.version
          ? ` · ${footerStamp.version === "live" ? "live" : `v${footerStamp.version}`}`
          : ""}
      </div>
    </section>
  );
}
