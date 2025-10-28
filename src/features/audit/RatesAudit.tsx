"use client";

import type { CostLineItem, MaterialCost } from "@/types/domain";
import { formatCurrency, formatCurrencyFromCents } from "@/lib/calc/format";
import { materialTotalInCents } from "@/lib/calc/rollups";
import { safeMul, toCents } from "@/lib/calc/money";

type Props = {
  costs: CostLineItem[];
  materials: MaterialCost[];
};

type Row = {
  id: string;
  type: string;
  label: string;
  rate: number;
  qty: number;
  total: number;
  warning: string;
};

const buildRows = (costs: CostLineItem[], materials: MaterialCost[]): Row[] => {
  const costRows = costs
    .map<Row | null>((cost) => {
      const rawRate = cost.rate;
      const rate = Number(rawRate ?? 0);
      const qty = Number(cost.qty ?? 0);
      const total = toCents(safeMul(rate, qty));
      let warning = "";
      if (rawRate == null || rawRate === "") {
        warning = "Rate missing";
      } else if (rate === 0) {
        warning = "Rate is zero";
      }
      if (!warning) return null;
      return {
        id: cost.id,
        type: cost.type,
        label: cost.roleOrSKU,
        rate,
        qty,
        total,
        warning,
      };
    })
    .filter((row): row is Row => Boolean(row));

  const materialRows = materials
    .map<Row | null>((material) => {
      const rawRate = material.unitPrice;
      const rate = Number(rawRate ?? 0);
      const qty = Number(material.qty ?? 0);
      const total = materialTotalInCents(material);
      let warning = "";
      if (rawRate == null) {
        warning = "Unit price missing";
      } else if (rate === 0) {
        warning = "Unit price is zero";
      }
      if (!warning) return null;
      return {
        id: material.id,
        type: material.costType,
        label: material.sku,
        rate,
        qty,
        total,
        warning,
      };
    })
    .filter((row): row is Row => Boolean(row));

  return [...costRows, ...materialRows];
};

export function RatesAudit({ costs, materials }: Props) {
  const rows = buildRows(costs, materials);
  return (
    <section className="card">
      <h2>Rates audit</h2>
      {rows.length === 0 ? (
        <p>All cost lines have rates and quantities.</p>
      ) : (
        <div className="table-scroll" style={{ marginTop: "1rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Role / SKU</th>
                <th>Rate</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Warning</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.type}</td>
                  <td>{row.label}</td>
                  <td>{formatCurrency(row.rate)}</td>
                  <td>{row.qty}</td>
                  <td>{formatCurrencyFromCents(row.total)}</td>
                  <td>
                    <span className="badge" style={{ background: "#fee2e2", color: "#7f1d1d" }}>
                      {row.warning}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
