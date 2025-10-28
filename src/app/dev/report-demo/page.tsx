"use client";

import { KPICard } from "@/features/report/components/KPICard";
import { BreakdownTable } from "@/features/report/components/BreakdownTable";
import { CashflowMiniChart } from "@/features/report/components/CashflowMiniChart";
import { InvoiceStatus } from "@/features/report/components/InvoiceStatus";

export default function ReportDemoPage() {
  return (
    <main className="container">
      <div className="card">
        <h1>Report component demo</h1>
        <p>Sample data to verify component rendering during development.</p>
      </div>
      <div className="kpi-grid">
        <KPICard label="Total" value={1250000} />
        <KPICard label="Labour" value={640000} />
        <KPICard label="Services" value={280000} />
        <KPICard label="Equipment" value={120000} />
        <KPICard label="Materials" value={210000} />
        <KPICard label="Variance" value={-35000} status="warning" />
      </div>
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <BreakdownTable
          rows={[
            { label: "Labour", amount: 640000 },
            { label: "Services", amount: 280000 },
            { label: "Equipment", amount: 120000 },
            { label: "Materials", amount: 210000 },
          ]}
          caption="Cost breakdown"
        />
      </div>
      <div className="card">
        <CashflowMiniChart
          data={{
            "2024-01": 100000,
            "2024-02": 120000,
            "2024-03": 140000,
          }}
        />
      </div>
      <div className="card">
        <InvoiceStatus
          totalCost={1250000}
          totalInvoiced={1180000}
          variance={-70000}
          upcomingInvoices={[
            { invoiceNo: "INV-102", invoiceDate: "2024-04-15" },
            { invoiceNo: "INV-103", invoiceDate: "2024-05-15" },
          ]}
        />
      </div>
    </main>
  );
}
