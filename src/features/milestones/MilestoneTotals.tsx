"use client";

import { useMemo } from "react";
import type { Milestone } from "@/types/domain";
import type { MilestoneTotals } from "@/lib/calc/rollups";
import { formatCurrencyFromCents } from "@/lib/calc/format";

type Props = {
  milestones: Milestone[];
  totalsById: Record<string, MilestoneTotals>;
  onSelect?: (milestoneId: string | null) => void;
  activeMilestoneId?: string | null;
};

type Row = {
  id: string;
  name: string;
  depth: number;
  totals: MilestoneTotals;
};

export function MilestoneTotals({ milestones, totalsById, onSelect, activeMilestoneId }: Props) {
  const rows = useMemo(() => {
    const byParent = milestones.reduce<Record<string, Milestone[]>>((acc, milestone) => {
      const parent = milestone.parentId ?? "root";
      acc[parent] = acc[parent] ? [...acc[parent], milestone] : [milestone];
      return acc;
    }, {});

    const sortMilestones = (list: Milestone[]) =>
      [...list].sort((a, b) => {
        const sortCompare = (Number(a.sortIndex) || 0) - (Number(b.sortIndex) || 0);
        if (sortCompare !== 0) return sortCompare;
        return (a.name || a.code || "").localeCompare(b.name || b.code || "");
      });

    const buildRows = (parentId: string, depth: number): Row[] => {
      const children = byParent[parentId];
      if (!children) return [];
      return sortMilestones(children).flatMap((child) => {
        const childTotals = totalsById[child.id];
        const current: Row = {
          id: child.id,
          name: child.name || child.code || child.id,
          depth,
          totals: childTotals ?? { labour: 0, services: 0, equipment: 0, materials: 0, total: 0 },
        };
        return [current, ...buildRows(child.id, depth + 1)];
      });
    };

    const hierarchical = buildRows("root", 0);
    const unassignedTotals = totalsById.unassigned;
    if (unassignedTotals) {
      hierarchical.push({
        id: "unassigned",
        name: "Unassigned",
        depth: 0,
        totals: unassignedTotals,
      });
    }
    return hierarchical;
  }, [milestones, totalsById]);

  return (
    <div className="card">
      <h2>Milestone totals</h2>
      {rows.length === 0 ? (
        <p>No milestones captured.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: "12rem" }}>Milestone</th>
                <th>Labour</th>
                <th>Services</th>
                <th>Equipment</th>
                <th>Materials</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.id === activeMilestoneId ? "table-row-active" : undefined}
                  onClick={() => onSelect?.(row.id === "unassigned" ? null : row.id)}
                  style={{ cursor: onSelect ? "pointer" : "default" }}
                >
                  <td style={{ paddingLeft: `${row.depth * 1.5}rem` }}>{row.name}</td>
                  <td>{formatCurrencyFromCents(row.totals.labour)}</td>
                  <td>{formatCurrencyFromCents(row.totals.services)}</td>
                  <td>{formatCurrencyFromCents(row.totals.equipment)}</td>
                  <td>{formatCurrencyFromCents(row.totals.materials)}</td>
                  <td>{formatCurrencyFromCents(row.totals.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
