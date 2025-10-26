"use client";

import { useMemo, useState } from "react";
import type { MaterialCost, Milestone, PaymentSchedule } from "@/types/domain";
import { addPayment } from "@/lib/repo/payments";
import { paymentScheduleSchema } from "@/lib/validation/schemas";
import { useToast } from "@/components/Toast";
import { formatCurrencyFromCents, formatCurrency } from "@/lib/calc/format";
import { safeAdd, toCents } from "@/lib/calc/money";
import type { MilestoneTotals } from "@/lib/calc/rollups";
import { PaymentForm, type PaymentDraft } from "./PaymentForm";
import { formatError } from "@/lib/errors/format";

type Props = {
  projectId: string;
  milestones: Milestone[];
  materials: MaterialCost[];
  projectTotals: MilestoneTotals;
  payments: PaymentSchedule[];
};

type PaymentErrors = Partial<Record<keyof PaymentDraft, string>>;

const emptyDraft: PaymentDraft = {
  invoiceNo: "",
  invoiceDate: "",
  amount: "",
  milestoneIds: [],
  materialCostIds: [],
  notes: "",
};

export function PaymentPlan({ projectId, milestones, materials, projectTotals, payments }: Props) {
  const { showSuccess, showError } = useToast();
  const [draft, setDraft] = useState<PaymentDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<PaymentErrors>({});

  const billedCents = useMemo(() => {
    return payments.reduce((sum, payment) => safeAdd(sum, toCents(payment.amount)), 0);
  }, [payments]);

  const remainingCents = useMemo(() => {
    return projectTotals.total - billedCents;
  }, [projectTotals.total, billedCents]);

  const handleSubmit = async () => {
    if (saving) return;
    setErrors({});
    const parse = paymentScheduleSchema.safeParse({
      invoiceNo: draft.invoiceNo,
      invoiceDate: draft.invoiceDate,
      amount: Number(draft.amount),
      milestoneIds: draft.milestoneIds,
      materialCostIds: draft.materialCostIds,
      notes: draft.notes || undefined,
    });
    if (!parse.success) {
      const issueMap: PaymentErrors = {};
      parse.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          issueMap[issue.path[0] as keyof PaymentDraft] = issue.message;
        }
      });
      setErrors(issueMap);
      return;
    }
    setSaving(true);
    try {
      await addPayment(projectId, {
        ...parse.data,
        createdAt: new Date().toISOString(),
      });
      setDraft(emptyDraft);
      showSuccess("Invoice recorded");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError(formatError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Payment schedule</h2>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0 }}>Billed: {formatCurrencyFromCents(billedCents)}</p>
          <p style={{ margin: 0 }}>Remaining: {formatCurrencyFromCents(remainingCents)}</p>
          <small>Total budget {formatCurrencyFromCents(projectTotals.total)}</small>
        </div>
      </div>
      {payments.length === 0 ? (
        <p>No invoices yet. Use the form below to create the first one.</p>
      ) : (
        <div className="table-scroll" style={{ marginTop: "1rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Milestones</th>
                <th>Materials</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.invoiceNo}</td>
                  <td>{payment.invoiceDate}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{payment.milestoneIds?.length ? payment.milestoneIds.length : "-"}</td>
                  <td>{payment.materialCostIds?.length ? payment.materialCostIds.length : "-"}</td>
                  <td>{payment.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaymentForm
        value={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
        milestones={milestones}
        materials={materials}
        loading={saving}
        errors={errors}
      />
    </section>
  );
}
