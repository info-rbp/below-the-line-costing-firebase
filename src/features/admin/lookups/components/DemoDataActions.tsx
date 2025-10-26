"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { formatError } from "@/lib/errors/format";

type ActionType = "seed" | "reset";

type ActionConfig = {
  type: ActionType;
  label: string;
  description: string;
  buttonClass: string;
};

const ACTIONS: ActionConfig[] = [
  {
    type: "seed",
    label: "Seed demo data",
    description:
      "This will create a fresh demo project with milestones, cost lines, materials, and payments tagged as seeded. Existing projects remain untouched.",
    buttonClass: "button-primary",
  },
  {
    type: "reset",
    label: "Reset demo data",
    description:
      "Removes all demo projects created by the seed script. Manual data is preserved. Use this before reseeding to keep Firestore tidy.",
    buttonClass: "button-secondary",
  },
];

export function DemoDataActions() {
  const { showError, showSuccess } = useToast();
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [submitting, setSubmitting] = useState<ActionType | null>(null);

  const closeModal = () => setPendingAction(null);

  const performAction = async (action: ActionType) => {
    setSubmitting(action);
    try {
      const response = await fetch("/api/admin/demo-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok || payload.status !== "ok") {
        throw new Error(payload.message ?? "Request failed");
      }
      if (action === "seed") {
        showSuccess(`Seeded project ${payload.summary.projectId}`);
      } else {
        const removed = Array.isArray(payload.summaries) ? payload.summaries.length : 0;
        showSuccess(removed > 0 ? `Removed ${removed} seeded project${removed === 1 ? "" : "s"}` : "No seeded projects were found");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError(formatError(error));
    } finally {
      setSubmitting(null);
      setPendingAction(null);
    }
  };

  return (
    <section className="card">
      <header className="demo-actions-header">
        <div>
          <h2>Demo data utilities</h2>
          <p className="text-muted">Generate or reset the full showcase dataset for client walk-throughs.</p>
        </div>
        <div className="demo-actions-buttons">
          {ACTIONS.map((action) => (
            <button
              key={action.type}
              type="button"
              className={action.buttonClass}
              onClick={() => setPendingAction(action.type)}
              disabled={Boolean(submitting)}
            >
              {submitting === action.type ? "Working…" : action.label}
            </button>
          ))}
        </div>
      </header>
      {pendingAction && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Confirm {ACTIONS.find((config) => config.type === pendingAction)?.label.toLowerCase()}</h3>
            <p>{ACTIONS.find((config) => config.type === pendingAction)?.description}</p>
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={closeModal} disabled={Boolean(submitting)}>
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={() => performAction(pendingAction)}
                disabled={Boolean(submitting)}
              >
                {submitting ? "Processing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
