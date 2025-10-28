"use client";

import { formatCurrencyFromCents } from "@/lib/calc/format";

type Row = {
  label: string;
  amount: number;
};

type Props = {
  rows: Row[];
  caption?: string;
};

export function BreakdownTable({ rows, caption }: Props) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <div className="table-scroll">
      <table className="table" role="table">
        {caption && <caption style={{ textAlign: "left", fontWeight: 600 }}>{caption}</caption>}
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col" style={{ textAlign: "right" }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td style={{ textAlign: "right" }}>{formatCurrencyFromCents(row.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td style={{ textAlign: "right" }}>{formatCurrencyFromCents(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
