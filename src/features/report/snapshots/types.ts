import type { MaybeTimestamp } from "@/lib/dates/snapshotLabel";

export type CostCategory = "Labour" | "Services" | "Equipment" | "Materials";

export type ReportFiltersState = {
  includeMilestoneIds: string[];
  excludeMilestoneIds: string[];
  costCategories: CostCategory[];
  monthRange?: { start: string; end: string } | null;
};

export type ExecutiveSummarySnapshot = {
  id?: string;
  createdAt?: MaybeTimestamp;
  filters: ReportFiltersState;
  totals: { label: string; amount: number }[];
  totalCost: number;
  totalInvoiced: number;
  variance: number;
  milestoneCount: number;
  dateWindow: { start: string; end: string };
  peakMonth?: { month: string; amount: number } | null;
  monthlyOutflows: Record<string, number>;
  payments: { invoiceNo: string; invoiceDate: string; amount: number; milestoneCount: number; materialCount: number }[];
  upcomingInvoices: { invoiceNo: string; invoiceDate: string }[];
  snapshotMonths: string[];
};
