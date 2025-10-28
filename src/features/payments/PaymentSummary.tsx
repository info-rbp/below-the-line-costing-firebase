"use client";

import type { CSSProperties } from "react";
import type { PaymentSchedule } from "@/types/domain";
import type { MilestoneTotals } from "@/lib/calc/rollups";
import { formatCurrencyFromCents } from "@/lib/calc/format";
import { safeAdd, toCents } from "@/lib/calc/money";

type Props = {
  payments: PaymentSchedule[];
  projectTotals: MilestoneTotals;
};

const badgeStyles: Record<"exact" | "under" | "over", CSSProperties> = {
  exact: { background: "#dcfce7", color: "#166534" },
  under: { background: "#fef9c3", color: "#92400e" },
  over: { background: "#fee2e2", color: "#7f1d1d" },
};

export function PaymentSummary({ payments, projectTotals }: Props) {
  const totalInvoicedCents = payments.reduce((sum, payment) => safeAdd(sum, toCents(payment.amount)), 0);
  const variance = totalInvoicedCents - projectTotals.total;

  let badgeLabel = "";
  let badgeType: keyof typeof badgeStyles = "exact";
  if (variance === 0) {
    badgeLabel = "Exact match";
    badgeType = "exact";
  } else if (variance < 0) {
    badgeLabel = "Under billed";
    badgeType = "under";
  } else {
    badgeLabel = "Over billed";
    badgeType = "over";
  }

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Payment reconciliation</h2>
        <span className="badge" style={badgeStyles[badgeType]}>
          {badgeLabel}
        </span>
      </div>
      <div className="list-grid" style={{ marginTop: "1rem" }}>
        <div>
          <strong>Total project cost</strong>
          <p>{formatCurrencyFromCents(projectTotals.total)}</p>
        </div>
        <div>
          <strong>Total invoiced</strong>
          <p>{formatCurrencyFromCents(totalInvoicedCents)}</p>
        </div>
        <div>
          <strong>Variance</strong>
          <p>{formatCurrencyFromCents(variance)}</p>
        </div>
      </div>
    </section>
  );
}
