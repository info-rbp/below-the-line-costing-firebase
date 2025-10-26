"use client";

import type { LookupCollection, LookupItem } from "@/lib/repo/lookups";
import { formatCurrency } from "@/lib/calc/format";

type Props = {
  collection: LookupCollection;
  items: LookupItem[];
  onEdit: (item: LookupItem) => void;
  onDelete: (item: LookupItem) => void;
};

export function LookupTable({ collection, items, onEdit, onDelete }: Props) {
  if (items.length === 0) {
    return <p>No values yet.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            {collection === "rateBands" && (
              <th scope="col" style={{ textAlign: "right" }}>
                Rate
              </th>
            )}
            <th scope="col" className="print-hidden" style={{ width: "140px" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <th scope="row">{item.name}</th>
              {collection === "rateBands" && (
                <td style={{ textAlign: "right" }}>
                  {item.rate !== undefined ? formatCurrency(item.rate) : <span className="badge badge-warning">Rate missing</span>}
                </td>
              )}
              <td className="print-hidden" style={{ display: "flex", gap: "0.5rem" }}>
                <button className="button-secondary" type="button" onClick={() => onEdit(item)}>
                  Edit
                </button>
                <button className="button-ghost" type="button" onClick={() => onDelete(item)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
