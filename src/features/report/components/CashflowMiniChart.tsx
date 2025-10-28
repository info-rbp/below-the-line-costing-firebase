"use client";

import { formatCurrencyFromCents } from "@/lib/calc/format";

type Props = {
  data: Record<string, number>;
  months?: string[];
};

export function CashflowMiniChart({ data, months }: Props) {
  const rows = (months ?? Object.keys(data)).sort().map((month) => ({
    month,
    amount: data[month] ?? 0,
  }));

  if (rows.length === 0) {
    return <p>No cash flow data for the selected window.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="table" role="table">
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col" style={{ textAlign: "right" }}>
              Outflow
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td style={{ textAlign: "right" }}>{formatCurrencyFromCents(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
