"use client";

import type { MaterialCost, Milestone } from "@/types/domain";

type PaymentDraft = {
  invoiceNo: string;
  invoiceDate: string;
  amount: string;
  milestoneIds: string[];
  materialCostIds: string[];
  notes: string;
};

type Props = {
  value: PaymentDraft;
  onChange: (next: PaymentDraft) => void;
  onSubmit: () => void;
  milestones: Milestone[];
  materials: MaterialCost[];
  loading?: boolean;
  errors?: Partial<Record<keyof PaymentDraft, string>>;
};

const toggleId = (ids: string[], id: string, checked: boolean) => {
  if (checked) {
    if (ids.includes(id)) return ids;
    return [...ids, id];
  }
  return ids.filter((current) => current !== id);
};

export function PaymentForm({ value, onChange, onSubmit, milestones, materials, loading, errors }: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="card"
      style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}
    >
      <h3>Create invoice</h3>
      <div className="list-grid" style={{ marginTop: "1rem" }}>
        <div>
          <label>Invoice number</label>
          <input
            value={value.invoiceNo}
            onChange={(event) => onChange({ ...value, invoiceNo: event.target.value })}
            data-error={errors?.invoiceNo ? "true" : undefined}
          />
          {errors?.invoiceNo && <p className="error-text">{errors.invoiceNo}</p>}
        </div>
        <div>
          <label>Invoice date</label>
          <input
            type="date"
            value={value.invoiceDate}
            onChange={(event) => onChange({ ...value, invoiceDate: event.target.value })}
            data-error={errors?.invoiceDate ? "true" : undefined}
          />
          {errors?.invoiceDate && <p className="error-text">{errors.invoiceDate}</p>}
        </div>
        <div>
          <label>Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value.amount}
            onChange={(event) => onChange({ ...value, amount: event.target.value })}
            data-error={errors?.amount ? "true" : undefined}
          />
          {errors?.amount && <p className="error-text">{errors.amount}</p>}
        </div>
        <div>
          <label>Milestones</label>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {milestones.map((milestone) => {
              const checked = value.milestoneIds.includes(milestone.id);
              return (
                <label key={milestone.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        milestoneIds: toggleId(value.milestoneIds, milestone.id, event.target.checked),
                      })
                    }
                  />
                  {milestone.name || milestone.code || milestone.id}
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <label>Material cost lines</label>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {materials.map((material) => {
              const checked = value.materialCostIds.includes(material.id);
              return (
                <label key={material.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        materialCostIds: toggleId(value.materialCostIds, material.id, event.target.checked),
                      })
                    }
                  />
                  {material.sku} ({material.costType})
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <label>Notes</label>
          <textarea value={value.notes} onChange={(event) => onChange({ ...value, notes: event.target.value })} />
        </div>
      </div>
      <div className="actions" style={{ justifyContent: "flex-end", marginTop: "1.5rem" }}>
        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add invoice"}
        </button>
      </div>
    </form>
  );
}

export type { PaymentDraft };
