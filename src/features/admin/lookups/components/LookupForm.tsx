"use client";

import type { LookupCollection } from "@/lib/repo/lookups";

export type LookupDraft = {
  name: string;
  rate?: string;
};

type Props = {
  collection: LookupCollection;
  value: LookupDraft;
  onChange: (value: LookupDraft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  busy?: boolean;
  mode?: "create" | "edit";
  errors?: Partial<Record<keyof LookupDraft, string>>;
};

const LABELS: Record<LookupCollection, { name: string; helper?: string; rateLabel?: string }> = {
  roles: { name: "Role name" },
  materials: { name: "Material name" },
  rateBands: { name: "Rate band", helper: "Provide a descriptive label", rateLabel: "Hourly rate" },
};

export function LookupForm({ collection, value, onChange, onSubmit, onCancel, busy, mode = "create", errors }: Props) {
  const labels = LABELS[collection];
  const showRate = collection === "rateBands";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="lookup-form"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div>
        <label htmlFor={`${collection}-name`}>{labels.name}</label>
        <input
          id={`${collection}-name`}
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          data-error={errors?.name ? "true" : undefined}
        />
        {labels.helper && <small style={{ color: "var(--text-muted)" }}>{labels.helper}</small>}
        {errors?.name && <p className="error-text">{errors.name}</p>}
      </div>
      {showRate && (
        <div>
          <label htmlFor={`${collection}-rate`}>{labels.rateLabel ?? "Rate"}</label>
          <input
            id={`${collection}-rate`}
            type="number"
            step="0.01"
            value={value.rate ?? ""}
            onChange={(event) => onChange({ ...value, rate: event.target.value })}
            data-error={errors?.rate ? "true" : undefined}
          />
          {errors?.rate && <p className="error-text">{errors.rate}</p>}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        {onCancel && (
          <button className="button-secondary" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
        <button className="button-primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : mode === "edit" ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
