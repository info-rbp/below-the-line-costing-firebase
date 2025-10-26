import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currency: z.string().default("AUD"),
});

export const milestoneSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortIndex: z.number().int().optional(),
});

export const costLineItemSchema = z.object({
  type: z.enum(["labour", "service", "equipment"]),
  roleOrSKU: z.string().min(1),
  rate: z.number().optional(),
  qty: z.number().optional(),
  unit: z.enum(["hr", "day", "ea"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  milestoneIds: z.array(z.string()).default([]),
});

export const materialCostSchema = z.object({
  sku: z.string().min(1),
  description: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  qty: z.number().nonnegative(),
  costType: z.enum(["one-time", "monthly", "milestone"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  milestoneIds: z.array(z.string()).default([]),
});

export const paymentScheduleSchema = z.object({
  invoiceNo: z.string().min(1),
  invoiceDate: z.string().min(1),
  amount: z.number().positive(),
  milestoneIds: z.array(z.string()).default([]),
  materialCostIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
