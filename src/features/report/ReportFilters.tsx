"use client";

import { useMemo } from "react";
import type { ReportFiltersState, CostCategory } from "./snapshots/types";

type MilestoneOption = {
  id: string;
  name?: string | null;
  code?: string | null;
};

type Props = {
  filters: ReportFiltersState;
  onChange: (next: ReportFiltersState) => void;
  milestones: MilestoneOption[];
  availableMonths: string[];
  onReset?: () => void;
  onCreateSnapshot?: () => void;
  snapshotBusy?: boolean;
};

const COST_OPTIONS: { key: CostCategory; label: string }[] = [
  { key: "Labour", label: "Labour" },
  { key: "Services", label: "Services" },
  { key: "Equipment", label: "Equipment" },
  { key: "Materials", label: "Materials" },
];

export function ReportFilters({
  filters,
  onChange,
  milestones,
  availableMonths,
  onReset,
  onCreateSnapshot,
  snapshotBusy,
}: Props) {
  const monthOptions = useMemo(() => [...availableMonths].sort(), [availableMonths]);

  const handleMilestoneSelect = (ids: string[], type: "include" | "exclude") => {
    onChange({
      ...filters,
      includeMilestoneIds: type === "include" ? ids : filters.includeMilestoneIds,
      excludeMilestoneIds: type === "exclude" ? ids : filters.excludeMilestoneIds,
    });
  };

  const handleCostToggle = (category: CostCategory, checked: boolean) => {
    const next = checked
      ? [...filters.costCategories, category]
      : filters.costCategories.filter((item) => item !== category);
    onChange({ ...filters, costCategories: next });
  };

  const handleMonthChange = (key: "start" | "end", value: string) => {
    const range = filters.monthRange ?? { start: "", end: "" };
    const nextRange = { ...range, [key]: value };
    if (!nextRange.start && !nextRange.end) {
      onChange({ ...filters, monthRange: null });
    } else {
      onChange({ ...filters, monthRange: nextRange });
    }
  };

  return (
    <section className="card" style={{ border: "1px solid var(--border-muted)", boxShadow: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <h2 style={{ margin: 0 }}>Report filters</h2>
        <div className="print-hidden" style={{ display: "flex", gap: "0.5rem" }}>
          {onReset && (
            <button className="button-secondary" type="button" onClick={onReset}>
              Reset filters
            </button>
          )}
          {onCreateSnapshot && (
            <button className="button-primary" type="button" onClick={onCreateSnapshot} disabled={snapshotBusy}>
              {snapshotBusy ? "Saving…" : "Create snapshot"}
            </button>
          )}
        </div>
      </div>

      <div className="list-grid" style={{ marginTop: "1.5rem" }}>
        <div>
          <label htmlFor="include-milestones">Only include these milestones</label>
          <select
            id="include-milestones"
            multiple
            value={filters.includeMilestoneIds}
            onChange={(event) =>
              handleMilestoneSelect(Array.from(event.target.selectedOptions, (option) => option.value), "include")
            }
          >
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name || milestone.code || milestone.id}
              </option>
            ))}
          </select>
          <small>Use Ctrl/Cmd + click to toggle multiple entries. Leave blank to include all milestones.</small>
        </div>

        <div>
          <label htmlFor="exclude-milestones">Exclude these milestones</label>
          <select
            id="exclude-milestones"
            multiple
            value={filters.excludeMilestoneIds}
            onChange={(event) =>
              handleMilestoneSelect(Array.from(event.target.selectedOptions, (option) => option.value), "exclude")
            }
          >
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name || milestone.code || milestone.id}
              </option>
            ))}
          </select>
          <small>Exclude child milestones if needed for partial reports.</small>
        </div>

        <div>
          <span style={{ fontWeight: 600 }}>Cost categories</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem" }}>
            {COST_OPTIONS.map((option) => {
              const checked = filters.costCategories.includes(option.key);
              return (
                <label key={option.key} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => handleCostToggle(option.key, event.target.checked)}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
          <small>Uncheck a category to remove it from totals.</small>
        </div>

        <div>
          <span style={{ fontWeight: 600 }}>Cash flow window</span>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <div>
              <label htmlFor="month-start">From</label>
              <input
                id="month-start"
                type="month"
                value={filters.monthRange?.start ?? ""}
                min={monthOptions[0] ?? ""}
                max={filters.monthRange?.end ?? monthOptions[monthOptions.length - 1] ?? ""}
                onChange={(event) => handleMonthChange("start", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="month-end">To</label>
              <input
                id="month-end"
                type="month"
                value={filters.monthRange?.end ?? ""}
                min={filters.monthRange?.start ?? monthOptions[0] ?? ""}
                max={monthOptions[monthOptions.length - 1] ?? ""}
                onChange={(event) => handleMonthChange("end", event.target.value)}
              />
            </div>
          </div>
          <small>Select a start and end month to focus the cash flow table.</small>
        </div>
      </div>
    </section>
  );
}
