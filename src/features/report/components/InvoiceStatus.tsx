"use client";

import { formatCurrencyFromCents } from "@/lib/calc/format";

type UpcomingInvoice = {
  invoiceNo: string;
  invoiceDate: string;
};

type Props = {
  totalInvoiced: number;
  totalCost: number;
  variance: number;
  upcomingInvoices: UpcomingInvoice[];
};

export function InvoiceStatus({ totalInvoiced, totalCost, variance, upcomingInvoices }: Props) {
  const badge = (() => {
    if (variance === 0) return { label: "Exact match", tone: "badge-success" };
    if (variance < 0) return { label: "Under billed", tone: "badge-warning" };
    return { label: "Over billed", tone: "badge-error" };
  })();

  return (
    <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border-muted)" }}>
      <div className="kpi-header" style={{ justifyContent: "space-between" }}>
        <span className="kpi-label">Payment summary</span>
        <span className={`badge ${badge.tone}`}>{badge.label}</span>
      </div>
      <dl className="summary-list">
        <div>
          <dt>Total project cost</dt>
          <dd>{formatCurrencyFromCents(totalCost)}</dd>
        </div>
        <div>
          <dt>Total invoiced</dt>
          <dd>{formatCurrencyFromCents(totalInvoiced)}</dd>
        </div>
        <div>
          <dt>Variance</dt>
          <dd>{formatCurrencyFromCents(variance)}</dd>
        </div>
      </dl>
      <div>
        <h4 style={{ marginBottom: "0.5rem" }}>Upcoming invoices</h4>
        {upcomingInvoices.length === 0 ? (
          <p>No upcoming invoices scheduled.</p>
        ) : (
          <ul>
            {upcomingInvoices.map((invoice) => (
              <li key={invoice.invoiceNo}>
                <strong>{invoice.invoiceNo}</strong> — {invoice.invoiceDate}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
