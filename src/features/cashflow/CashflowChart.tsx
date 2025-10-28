"use client";

import { useMemo } from "react";
import { formatCurrencyFromCents } from "@/lib/calc/format";

type Props = {
  monthlyOutflows: Record<string, number>;
};

export function CashflowChart({ monthlyOutflows }: Props) {
  const months = useMemo(() => Object.keys(monthlyOutflows).sort(), [monthlyOutflows]);

  const handleExport = () => {
    const lines = ["Month,Amount"]; 
    months.forEach((month) => {
      const cents = monthlyOutflows[month];
      lines.push(`${month},${(cents / 100).toFixed(2)}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cashflow.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Cash flow</h2>
        <button className="button-secondary" onClick={handleExport} disabled={months.length === 0}>
          Export CSV
        </button>
      </div>
      {months.length === 0 ? (
        <p>No cash flow data yet.</p>
      ) : (
        <div className="table-scroll" style={{ marginTop: "1rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => (
                <tr key={month}>
                  <td>{month}</td>
                  <td>{formatCurrencyFromCents(monthlyOutflows[month])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
