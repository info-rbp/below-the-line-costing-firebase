export type Project = {
  id: string;
  name: string;
  clientName: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  status?: "draft" | "active" | "closed";
  createdAt: string;
  updatedAt: string;
};

export type Milestone = {
  id: string;
  code: string;
  name: string;
  startDate?: string;
  endDate?: string;
  parentId?: string | null;
  sortIndex?: number;
  createdAt: string;
};

export type CostLineItem = {
  id: string;
  type: "labour" | "service" | "equipment";
  roleOrSKU: string;
  rate?: number;
  qty?: number;
  unit?: "hr" | "day" | "ea";
  startDate?: string;
  endDate?: string;
  milestoneIds: string[];
  createdAt: string;
};

export type MaterialCost = {
  id: string;
  sku: string;
  description?: string;
  unitPrice: number;
  qty: number;
  costType: "one-time" | "monthly" | "milestone";
  startDate?: string;
  endDate?: string;
  milestoneIds: string[];
  createdAt: string;
};

export type PaymentSchedule = {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  milestoneIds: string[];
  materialCostIds: string[];
  notes?: string;
  createdAt: string;
};
