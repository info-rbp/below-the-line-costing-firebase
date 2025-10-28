"use client";

import { formatCurrencyFromCents } from "@/lib/calc/format";

type KPICardProps = {
  label: string;
  value: number;
  currency?: boolean;
  status?: "neutral" | "success" | "warning" | "error";
  description?: string;
};

const statusClass: Record<NonNullable<KPICardProps["status"]>, string> = {
  neutral: "badge",
  success: "badge badge-success",
  warning: "badge badge-warning",
  error: "badge badge-error",
};

export function KPICard({ label, value, currency = true, status = "neutral", description }: KPICardProps) {
  const displayValue = currency ? formatCurrencyFromCents(value) : new Intl.NumberFormat().format(value);
  return (
    <div className="kpi-card" aria-live="polite">
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        {status !== "neutral" && <span className={statusClass[status]}>{statusLabel(status)}</span>}
      </div>
      <strong className="kpi-value">{displayValue}</strong>
      {description && <p className="kpi-description">{description}</p>}
    </div>
  );
}

function statusLabel(status: KPICardProps["status"]) {
  switch (status) {
    case "success":
      return "On track";
    case "warning":
      return "Attention";
    case "error":
      return "Action required";
    default:
      return "";
  }
}
