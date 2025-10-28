"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import {
  projectSchema,
  milestoneSchema,
  costLineItemSchema,
  materialCostSchema,
  paymentScheduleSchema,
} from "@/lib/validation/schemas";
import { createProject, getProject, updateProject } from "@/lib/repo/projects";
import {
  listMilestones,
  removeMilestonesNotIn,
  setMilestone,
} from "@/lib/repo/milestones";
import {
  listCostLineItems,
  listMaterialCosts,
  removeCostLineItemsNotIn,
  removeMaterialCostsNotIn,
  setCostLineItem,
  setMaterialCost,
} from "@/lib/repo/costs";
import {
  listPayments,
  removePaymentsNotIn,
  setPayment,
} from "@/lib/repo/payments";
import { addLookupItem, deleteLookupItem, listLookup, LookupCollection, LookupItem } from "@/lib/repo/lookups";
import { formatCurrency } from "@/lib/calc/format";
import type { Project } from "@/types/domain";

const steps = [
  "Project basics",
  "Milestones",
  "Labour and services",
  "Materials",
  "Payment plan",
  "Review and submit",
];

type MilestoneForm = {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  parentId: string | null;
  sortIndex: string;
  createdAt?: string;
};

type CostLineItemForm = {
  id: string;
  type: "labour" | "service" | "equipment";
  roleOrSKU: string;
  rate: string;
  qty: string;
  unit: "hr" | "day" | "ea" | "";
  startDate: string;
  endDate: string;
  milestoneIds: string[];
  createdAt?: string;
};

type MaterialCostForm = {
  id: string;
  sku: string;
  description: string;
  unitPrice: string;
  qty: string;
  costType: "one-time" | "monthly" | "milestone";
  startDate: string;
  endDate: string;
  milestoneIds: string[];
  createdAt?: string;
};

type PaymentForm = {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  amount: string;
  milestoneIds: string[];
  materialCostIds: string[];
  notes: string;
  createdAt?: string;
};

type FieldErrors<T extends string> = Partial<Record<T, string>>;

const emptyMilestone = (): MilestoneForm => ({
  id: randomId(),
  code: "",
  name: "",
  startDate: "",
  endDate: "",
  parentId: null,
  sortIndex: "",
});

const emptyCost = (): CostLineItemForm => ({
  id: randomId(),
  type: "labour",
  roleOrSKU: "",
  rate: "",
  qty: "",
  unit: "",
  startDate: "",
  endDate: "",
  milestoneIds: [],
});

const emptyMaterial = (): MaterialCostForm => ({
  id: randomId(),
  sku: "",
  description: "",
  unitPrice: "",
  qty: "",
  costType: "one-time",
  startDate: "",
  endDate: "",
  milestoneIds: [],
});

const emptyPayment = (): PaymentForm => ({
  id: randomId(),
  invoiceNo: "",
  invoiceDate: "",
  amount: "",
  milestoneIds: [],
  materialCostIds: [],
  notes: "",
});

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export default function WizardPage() {
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId");

  const [activeStep, setActiveStep] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectBasics, setProjectBasics] = useState({
    name: "",
    clientName: "",
    startDate: "",
    endDate: "",
    currency: "AUD",
  });
  const [projectErrors, setProjectErrors] = useState<FieldErrors<"name" | "clientName" | "startDate" | "endDate" | "currency">>({});

  const [milestones, setMilestones] = useState<MilestoneForm[]>([emptyMilestone()]);
  const [milestoneErrors, setMilestoneErrors] = useState<Record<string, FieldErrors<"code" | "name" | "startDate" | "endDate" | "parentId" | "sortIndex">>>({});

  const [costs, setCosts] = useState<CostLineItemForm[]>([emptyCost()]);
  const [costErrors, setCostErrors] = useState<Record<string, FieldErrors<"type" | "roleOrSKU" | "rate" | "qty" | "unit" | "startDate" | "endDate">>>({});

  const [materials, setMaterials] = useState<MaterialCostForm[]>([emptyMaterial()]);
  const [materialErrors, setMaterialErrors] = useState<Record<string, FieldErrors<"sku" | "description" | "unitPrice" | "qty" | "costType" | "startDate" | "endDate">>>({});

  const [payments, setPayments] = useState<PaymentForm[]>([emptyPayment()]);
  const [paymentErrors, setPaymentErrors] = useState<Record<string, FieldErrors<"invoiceNo" | "invoiceDate" | "amount" | "notes">>>({});

  const [isSaving, setIsSaving] = useState(false);

  const [roles, setRoles] = useState<LookupItem[]>([]);
  const [materialsLookup, setMaterialsLookup] = useState<LookupItem[]>([]);
  const [rateBands, setRateBands] = useState<LookupItem[]>([]);

  const loadLookups = useCallback(
    async (id: string) => {
      const [roleItems, materialItems, rateBandItems] = await Promise.all([
        listLookup(id, "roles"),
        listLookup(id, "materials"),
        listLookup(id, "rateBands"),
      ]);
      setRoles(roleItems);
      setMaterialsLookup(materialItems);
      setRateBands(rateBandItems);
    },
    []
  );

  useEffect(() => {
    if (!initialProjectId) return;
    (async () => {
      try {
        const [project, milestoneData, costData, materialData, paymentData] = await Promise.all([
          getProject(initialProjectId),
          listMilestones(initialProjectId),
          listCostLineItems(initialProjectId),
          listMaterialCosts(initialProjectId),
          listPayments(initialProjectId),
        ]);
        setProjectId(initialProjectId);
        setProjectBasics({
          name: project.name,
          clientName: project.clientName,
          startDate: project.startDate ?? "",
          endDate: project.endDate ?? "",
          currency: project.currency ?? "AUD",
        });
        setMilestones(
          milestoneData.length
            ? milestoneData.map((item) => ({
                id: item.id,
                code: item.code,
                name: item.name,
                startDate: item.startDate ?? "",
                endDate: item.endDate ?? "",
                parentId: item.parentId ?? null,
                sortIndex: item.sortIndex !== undefined ? String(item.sortIndex) : "",
                createdAt: item.createdAt,
              }))
            : [emptyMilestone()]
        );
        setCosts(
          costData.length
            ? costData.map((item) => ({
                id: item.id,
                type: item.type,
                roleOrSKU: item.roleOrSKU,
                rate: item.rate !== undefined ? String(item.rate) : "",
                qty: item.qty !== undefined ? String(item.qty) : "",
                unit: item.unit ?? "",
                startDate: item.startDate ?? "",
                endDate: item.endDate ?? "",
                milestoneIds: item.milestoneIds ?? [],
                createdAt: item.createdAt,
              }))
            : [emptyCost()]
        );
        setMaterials(
          materialData.length
            ? materialData.map((item) => ({
                id: item.id,
                sku: item.sku,
                description: item.description ?? "",
                unitPrice: String(item.unitPrice),
                qty: String(item.qty),
                costType: item.costType,
                startDate: item.startDate ?? "",
                endDate: item.endDate ?? "",
                milestoneIds: item.milestoneIds ?? [],
                createdAt: item.createdAt,
              }))
            : [emptyMaterial()]
        );
        setPayments(
          paymentData.length
            ? paymentData.map((item) => ({
                id: item.id,
                invoiceNo: item.invoiceNo,
                invoiceDate: item.invoiceDate,
                amount: String(item.amount),
                milestoneIds: item.milestoneIds ?? [],
                materialCostIds: item.materialCostIds ?? [],
                notes: item.notes ?? "",
                createdAt: item.createdAt,
              }))
            : [emptyPayment()]
        );
        await loadLookups(initialProjectId);
        showSuccess("Loaded existing project");
      } catch (error) {
        console.error(error);
        showError("Unable to load project data");
      }
    })();
  }, [initialProjectId, loadLookups, showError, showSuccess]);

  useEffect(() => {
    if (projectId) {
      loadLookups(projectId).catch((error) => {
        console.error(error);
        showError("Unable to load lookup values");
      });
    }
  }, [projectId, loadLookups, showError]);

  const projectValidation = useMemo(() => {
    const result = projectSchema.safeParse(projectBasics);
    const errors: FieldErrors<"name" | "clientName" | "startDate" | "endDate" | "currency"> = {};
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof typeof errors;
        if (field) {
          errors[field] = issue.message;
        }
      });
    }
    return { valid: result.success, errors };
  }, [projectBasics]);

  useEffect(() => {
    setProjectErrors(projectValidation.errors);
  }, [projectValidation]);

  const projectValid = projectValidation.valid;

  const milestoneValidation = useMemo(() => {
    const errors: typeof milestoneErrors = {};
    let success = true;
    milestones.forEach((item) => {
      const parsed = milestoneSchema.safeParse({
        code: item.code,
        name: item.name,
        startDate: item.startDate || undefined,
        endDate: item.endDate || undefined,
        parentId: item.parentId || undefined,
        sortIndex: item.sortIndex ? Number(item.sortIndex) : undefined,
      });
      if (!parsed.success) {
        success = false;
        const entry: FieldErrors<"code" | "name" | "startDate" | "endDate" | "parentId" | "sortIndex"> = {};
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof typeof entry;
          if (field) {
            entry[field] = issue.message;
          }
        });
        errors[item.id] = entry;
      }
    });
    return { valid: success, errors };
  }, [milestones]);

  useEffect(() => {
    setMilestoneErrors(milestoneValidation.errors);
  }, [milestoneValidation]);

  const milestonesValid = milestoneValidation.valid;

  const costValidation = useMemo(() => {
    const errors: typeof costErrors = {};
    let success = true;
    costs.forEach((item) => {
      if (!item.roleOrSKU && !item.rate && !item.qty) {
        return;
      }
      const parsed = costLineItemSchema.safeParse({
        type: item.type,
        roleOrSKU: item.roleOrSKU,
        rate: item.rate ? Number(item.rate) : undefined,
        qty: item.qty ? Number(item.qty) : undefined,
        unit: item.unit ? (item.unit as "hr" | "day" | "ea") : undefined,
        startDate: item.startDate || undefined,
        endDate: item.endDate || undefined,
        milestoneIds: item.milestoneIds,
      });
      if (!parsed.success) {
        success = false;
        const entry: FieldErrors<"type" | "roleOrSKU" | "rate" | "qty" | "unit" | "startDate" | "endDate"> = {};
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof typeof entry;
          if (field) {
            entry[field] = issue.message;
          }
        });
        errors[item.id] = entry;
      }
    });
    return { valid: success, errors };
  }, [costs]);

  useEffect(() => {
    setCostErrors(costValidation.errors);
  }, [costValidation]);

  const costsValid = costValidation.valid || costs.every((item) => !item.roleOrSKU && !item.rate && !item.qty);

  const materialValidation = useMemo(() => {
    const errors: typeof materialErrors = {};
    let success = true;
    materials.forEach((item) => {
      if (!item.sku && !item.unitPrice) return;
      const parsed = materialCostSchema.safeParse({
        sku: item.sku,
        description: item.description || undefined,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
        qty: item.qty ? Number(item.qty) : 0,
        costType: item.costType,
        startDate: item.startDate || undefined,
        endDate: item.endDate || undefined,
        milestoneIds: item.milestoneIds,
      });
      if (!parsed.success) {
        success = false;
        const entry: FieldErrors<"sku" | "description" | "unitPrice" | "qty" | "costType" | "startDate" | "endDate"> = {};
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof typeof entry;
          if (field) {
            entry[field] = issue.message;
          }
        });
        errors[item.id] = entry;
      }
    });
    return { valid: success, errors };
  }, [materials]);

  useEffect(() => {
    setMaterialErrors(materialValidation.errors);
  }, [materialValidation]);

  const materialsValid =
    materialValidation.valid || materials.every((item) => !item.sku && !item.unitPrice && !item.qty);

  const paymentValidation = useMemo(() => {
    const errors: typeof paymentErrors = {};
    let success = true;
    payments.forEach((item) => {
      if (!item.invoiceNo && !item.amount) return;
      const parsed = paymentScheduleSchema.safeParse({
        invoiceNo: item.invoiceNo,
        invoiceDate: item.invoiceDate,
        amount: item.amount ? Number(item.amount) : 0,
        milestoneIds: item.milestoneIds,
        materialCostIds: item.materialCostIds,
        notes: item.notes || undefined,
      });
      if (!parsed.success) {
        success = false;
        const entry: FieldErrors<"invoiceNo" | "invoiceDate" | "amount" | "notes"> = {};
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof typeof entry;
          if (field) {
            entry[field] = issue.message;
          }
        });
        errors[item.id] = entry;
      }
    });
    return { valid: success, errors };
  }, [payments]);

  useEffect(() => {
    setPaymentErrors(paymentValidation.errors);
  }, [paymentValidation]);

  const paymentsValid =
    paymentValidation.valid || payments.every((item) => !item.invoiceNo && !item.amount && !item.invoiceDate);

  const isStepValid = [projectValid, milestonesValid, costsValid, materialsValid, paymentsValid, true];

  const scrollToError = () => {
    setTimeout(() => {
      const el = document.querySelector('[data-error="true"]');
      if (el && "scrollIntoView" in el) {
        (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 0);
  };

  const handleNext = () => {
    if (!isStepValid[activeStep]) {
      scrollToError();
      showError("Please fix the highlighted fields");
      return;
    }
    setActiveStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setActiveStep((step) => Math.max(step - 1, 0));
  };

  const upsertMilestone = (index: number, changes: Partial<MilestoneForm>) => {
    setMilestones((items) => {
      const clone = [...items];
      clone[index] = { ...clone[index], ...changes };
      return clone;
    });
  };

  const upsertCost = (index: number, changes: Partial<CostLineItemForm>) => {
    setCosts((items) => {
      const clone = [...items];
      clone[index] = { ...clone[index], ...changes };
      return clone;
    });
  };

  const upsertMaterial = (index: number, changes: Partial<MaterialCostForm>) => {
    setMaterials((items) => {
      const clone = [...items];
      clone[index] = { ...clone[index], ...changes };
      return clone;
    });
  };

  const upsertPayment = (index: number, changes: Partial<PaymentForm>) => {
    setPayments((items) => {
      const clone = [...items];
      clone[index] = { ...clone[index], ...changes };
      return clone;
    });
  };

  const persistLookup = async (collection: LookupCollection, value: string) => {
    if (!projectId) {
      showError("Save the project first to manage lookups");
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      showError("Enter a value before saving");
      return;
    }
    try {
      await addLookupItem(projectId, collection, { name: trimmed });
      await loadLookups(projectId);
      showSuccess("Lookup saved");
    } catch (error) {
      console.error(error);
      showError("Unable to save lookup value");
    }
  };

  const removeLookup = async (collection: LookupCollection, id: string) => {
    if (!projectId) return;
    try {
      await deleteLookupItem(projectId, collection, id);
      await loadLookups(projectId);
      showSuccess("Lookup removed");
    } catch (error) {
      console.error(error);
      showError("Unable to remove lookup value");
    }
  };

  const persist = useCallback(
    async (finalise: boolean) => {
      if (!projectValid) {
        scrollToError();
        showError("Project basics are required before saving");
        return;
      }
      setIsSaving(true);
      try {
        const projectPayload: Omit<Project, "id" | "createdAt" | "updatedAt"> = {
          name: projectBasics.name,
          clientName: projectBasics.clientName,
          startDate: projectBasics.startDate || undefined,
          endDate: projectBasics.endDate || undefined,
          currency: projectBasics.currency || "AUD",
          status: finalise ? "active" : "draft" as const,
        };

        let id = projectId;
        if (!id) {
          id = await createProject(projectPayload);
          setProjectId(id);
        } else {
          await updateProject(id, projectPayload);
        }

        if (!id) throw new Error("Project identifier missing after save");

        const milestoneIds = milestones
          .filter((item) => item.code && item.name)
          .map(async (item) => {
            const createdAt = item.createdAt ?? new Date().toISOString();
            await setMilestone(id!, item.id, {
              code: item.code,
              name: item.name,
              startDate: item.startDate || undefined,
              endDate: item.endDate || undefined,
              parentId: item.parentId || null,
              sortIndex: item.sortIndex ? Number(item.sortIndex) : undefined,
              createdAt,
            });
            return item.id;
          });
        const savedMilestoneIds = await Promise.all(milestoneIds);
        await removeMilestonesNotIn(id, savedMilestoneIds);

        const costIds = await Promise.all(
          costs
            .filter((item) => item.roleOrSKU)
            .map(async (item) => {
              const createdAt = item.createdAt ?? new Date().toISOString();
              await setCostLineItem(id!, item.id, {
                type: item.type,
                roleOrSKU: item.roleOrSKU,
                rate: item.rate ? Number(item.rate) : undefined,
                qty: item.qty ? Number(item.qty) : undefined,
                unit: item.unit || undefined,
                startDate: item.startDate || undefined,
                endDate: item.endDate || undefined,
                milestoneIds: item.milestoneIds,
                createdAt,
              });
              return item.id;
            })
        );
        await removeCostLineItemsNotIn(id, costIds);

        const materialIds = await Promise.all(
          materials
            .filter((item) => item.sku)
            .map(async (item) => {
              const createdAt = item.createdAt ?? new Date().toISOString();
              await setMaterialCost(id!, item.id, {
                sku: item.sku,
                description: item.description || undefined,
                unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
                qty: item.qty ? Number(item.qty) : 0,
                costType: item.costType,
                startDate: item.startDate || undefined,
                endDate: item.endDate || undefined,
                milestoneIds: item.milestoneIds,
                createdAt,
              });
              return item.id;
            })
        );
        await removeMaterialCostsNotIn(id, materialIds);

        const paymentIds = await Promise.all(
          payments
            .filter((item) => item.invoiceNo)
            .map(async (item) => {
              const createdAt = item.createdAt ?? new Date().toISOString();
              await setPayment(id!, item.id, {
                invoiceNo: item.invoiceNo,
                invoiceDate: item.invoiceDate,
                amount: item.amount ? Number(item.amount) : 0,
                milestoneIds: item.milestoneIds,
                materialCostIds: item.materialCostIds,
                notes: item.notes || undefined,
                createdAt,
              });
              return item.id;
            })
        );
        await removePaymentsNotIn(id, paymentIds);

        showSuccess(finalise ? "Project submitted" : "Draft saved");
        if (finalise) {
          router.push(`/projects/${id}`);
        }
      } catch (error) {
        console.error(error);
        showError("Unable to persist project");
      } finally {
        setIsSaving(false);
      }
    },
    [projectValid, projectBasics, projectId, milestones, costs, materials, payments, router, showError, showSuccess]
  );

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <section className="card">
            <h2>Project basics</h2>
            <div className="list-grid">
              <div>
                <label htmlFor="project-name">Project name</label>
                <input
                  id="project-name"
                  value={projectBasics.name}
                  onChange={(event) => setProjectBasics((data) => ({ ...data, name: event.target.value }))}
                  data-error={projectErrors.name ? "true" : undefined}
                />
                {projectErrors.name && <p className="error-text">{projectErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="client-name">Client name</label>
                <input
                  id="client-name"
                  value={projectBasics.clientName}
                  onChange={(event) => setProjectBasics((data) => ({ ...data, clientName: event.target.value }))}
                  data-error={projectErrors.clientName ? "true" : undefined}
                />
                {projectErrors.clientName && <p className="error-text">{projectErrors.clientName}</p>}
              </div>
              <div>
                <label htmlFor="start-date">Start date</label>
                <input
                  id="start-date"
                  type="date"
                  value={projectBasics.startDate}
                  onChange={(event) => setProjectBasics((data) => ({ ...data, startDate: event.target.value }))}
                  data-error={projectErrors.startDate ? "true" : undefined}
                />
                {projectErrors.startDate && <p className="error-text">{projectErrors.startDate}</p>}
              </div>
              <div>
                <label htmlFor="end-date">End date</label>
                <input
                  id="end-date"
                  type="date"
                  value={projectBasics.endDate}
                  onChange={(event) => setProjectBasics((data) => ({ ...data, endDate: event.target.value }))}
                  data-error={projectErrors.endDate ? "true" : undefined}
                />
                {projectErrors.endDate && <p className="error-text">{projectErrors.endDate}</p>}
              </div>
              <div>
                <label htmlFor="currency">Currency</label>
                <input
                  id="currency"
                  value={projectBasics.currency}
                  onChange={(event) => setProjectBasics((data) => ({ ...data, currency: event.target.value }))}
                  data-error={projectErrors.currency ? "true" : undefined}
                />
                {projectErrors.currency && <p className="error-text">{projectErrors.currency}</p>}
              </div>
            </div>
          </section>
        );
      case 1:
        return (
          <section className="card">
            <h2>Milestones</h2>
            <button className="button-secondary" onClick={() => setMilestones((items) => [...items, emptyMilestone()])}>
              Add milestone
            </button>
            <div className="list-grid" style={{ marginTop: "1.5rem" }}>
              {milestones.map((item, index) => (
                <div key={item.id} className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3>Milestone {index + 1}</h3>
                    {milestones.length > 1 && (
                      <button
                        className="button-ghost"
                        onClick={() => setMilestones((items) => items.filter((milestone) => milestone.id !== item.id))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="list-grid">
                    <div>
                      <label>Code</label>
                      <input
                        value={item.code}
                        onChange={(event) => upsertMilestone(index, { code: event.target.value })}
                        data-error={milestoneErrors[item.id]?.code ? "true" : undefined}
                      />
                      {milestoneErrors[item.id]?.code && (
                        <p className="error-text">{milestoneErrors[item.id]?.code}</p>
                      )}
                    </div>
                    <div>
                      <label>Name</label>
                      <input
                        value={item.name}
                        onChange={(event) => upsertMilestone(index, { name: event.target.value })}
                        data-error={milestoneErrors[item.id]?.name ? "true" : undefined}
                      />
                      {milestoneErrors[item.id]?.name && (
                        <p className="error-text">{milestoneErrors[item.id]?.name}</p>
                      )}
                    </div>
                    <div>
                      <label>Start date</label>
                      <input
                        type="date"
                        value={item.startDate}
                        onChange={(event) => upsertMilestone(index, { startDate: event.target.value })}
                        data-error={milestoneErrors[item.id]?.startDate ? "true" : undefined}
                      />
                    </div>
                    <div>
                      <label>End date</label>
                      <input
                        type="date"
                        value={item.endDate}
                        onChange={(event) => upsertMilestone(index, { endDate: event.target.value })}
                        data-error={milestoneErrors[item.id]?.endDate ? "true" : undefined}
                      />
                    </div>
                    <div>
                      <label>Parent milestone</label>
                      <select
                        value={item.parentId ?? ""}
                        onChange={(event) => upsertMilestone(index, { parentId: event.target.value || null })}
                      >
                        <option value="">None</option>
                        {milestones
                          .filter((milestone) => milestone.id !== item.id)
                          .map((milestone) => (
                            <option key={milestone.id} value={milestone.id}>
                              {milestone.name || milestone.code || milestone.id}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label>Sort index</label>
                      <input
                        type="number"
                        value={item.sortIndex}
                        onChange={(event) => upsertMilestone(index, { sortIndex: event.target.value })}
                        data-error={milestoneErrors[item.id]?.sortIndex ? "true" : undefined}
                      />
                      {milestoneErrors[item.id]?.sortIndex && (
                        <p className="error-text">{milestoneErrors[item.id]?.sortIndex}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 2:
        return (
          <section className="card">
            <h2>Labour and services</h2>
            <button className="button-secondary" onClick={() => setCosts((items) => [...items, emptyCost()])}>
              Add cost line
            </button>
            <div className="list-grid" style={{ marginTop: "1.5rem" }}>
              {costs.map((item, index) => (
                <div key={item.id} className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3>Cost line {index + 1}</h3>
                    {costs.length > 1 && (
                      <button
                        className="button-ghost"
                        onClick={() => setCosts((values) => values.filter((value) => value.id !== item.id))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="list-grid">
                    <div>
                      <label>Type</label>
                      <select
                        value={item.type}
                        onChange={(event) => upsertCost(index, { type: event.target.value as CostLineItemForm["type"] })}
                      >
                        <option value="labour">Labour</option>
                        <option value="service">Service</option>
                        <option value="equipment">Equipment</option>
                      </select>
                    </div>
                    <div>
                      <label>Role or SKU</label>
                      <input
                        value={item.roleOrSKU}
                        list="role-options"
                        onChange={(event) => upsertCost(index, { roleOrSKU: event.target.value })}
                        data-error={costErrors[item.id]?.roleOrSKU ? "true" : undefined}
                      />
                      {costErrors[item.id]?.roleOrSKU && (
                        <p className="error-text">{costErrors[item.id]?.roleOrSKU}</p>
                      )}
                    </div>
                    <div>
                      <label>Rate ({rateBands.length ? "suggested bands" : ""})</label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(event) => upsertCost(index, { rate: event.target.value })}
                        data-error={costErrors[item.id]?.rate ? "true" : undefined}
                      />
                      {rateBands.length > 0 && (
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                          {rateBands.map((rateBand) => (
                            <button
                              key={rateBand.id}
                              type="button"
                              className="badge"
                              onClick={() =>
                                upsertCost(index, {
                                  rate: rateBand.rate !== undefined ? rateBand.rate.toString() : item.rate,
                                })
                              }
                            >
                              {rateBand.rate !== undefined ? formatCurrency(rateBand.rate) : rateBand.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(event) => upsertCost(index, { qty: event.target.value })}
                        data-error={costErrors[item.id]?.qty ? "true" : undefined}
                      />
                    </div>
                    <div>
                      <label>Unit</label>
                      <select
                        value={item.unit}
                        onChange={(event) =>
                          upsertCost(index, { unit: event.target.value as CostLineItemForm["unit"] })
                        }
                      >
                        <option value="">Select unit</option>
                        <option value="hr">Hour</option>
                        <option value="day">Day</option>
                        <option value="ea">Each</option>
                      </select>
                    </div>
                    <div>
                      <label>Milestones</label>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {milestones.map((milestone) => {
                          const checked = item.milestoneIds.includes(milestone.id);
                          return (
                            <label key={milestone.id} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  const next = event.target.checked
                                    ? [...item.milestoneIds, milestone.id]
                                    : item.milestoneIds.filter((id) => id !== milestone.id);
                                  upsertCost(index, { milestoneIds: next });
                                }}
                              />
                              {milestone.name || milestone.code}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <datalist id="role-options">
              {roles.map((role) => (
                <option key={role.id} value={role.name} />
              ))}
            </datalist>
          </section>
        );
      case 3:
        return (
          <section className="card">
            <h2>Materials</h2>
            <button className="button-secondary" onClick={() => setMaterials((items) => [...items, emptyMaterial()])}>
              Add material cost
            </button>
            <div className="list-grid" style={{ marginTop: "1.5rem" }}>
              {materials.map((item, index) => (
                <div key={item.id} className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3>Material {index + 1}</h3>
                    {materials.length > 1 && (
                      <button
                        className="button-ghost"
                        onClick={() => setMaterials((values) => values.filter((value) => value.id !== item.id))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="list-grid">
                    <div>
                      <label>SKU</label>
                      <input
                        value={item.sku}
                        list="material-options"
                        onChange={(event) => upsertMaterial(index, { sku: event.target.value })}
                        data-error={materialErrors[item.id]?.sku ? "true" : undefined}
                      />
                      {materialErrors[item.id]?.sku && (
                        <p className="error-text">{materialErrors[item.id]?.sku}</p>
                      )}
                    </div>
                    <div>
                      <label>Description</label>
                      <textarea
                        value={item.description}
                        onChange={(event) => upsertMaterial(index, { description: event.target.value })}
                      />
                    </div>
                    <div>
                      <label>Unit price</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(event) => upsertMaterial(index, { unitPrice: event.target.value })}
                        data-error={materialErrors[item.id]?.unitPrice ? "true" : undefined}
                      />
                    </div>
                    <div>
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(event) => upsertMaterial(index, { qty: event.target.value })}
                        data-error={materialErrors[item.id]?.qty ? "true" : undefined}
                      />
                    </div>
                    <div>
                      <label>Cost type</label>
                      <select
                        value={item.costType}
                        onChange={(event) =>
                          upsertMaterial(index, {
                            costType: event.target.value as MaterialCostForm["costType"],
                          })
                        }
                      >
                        <option value="one-time">One-time</option>
                        <option value="monthly">Monthly</option>
                        <option value="milestone">Milestone</option>
                      </select>
                    </div>
                    <div>
                      <label>Milestones</label>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {milestones.map((milestone) => {
                          const checked = item.milestoneIds.includes(milestone.id);
                          return (
                            <label key={milestone.id} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  const next = event.target.checked
                                    ? [...item.milestoneIds, milestone.id]
                                    : item.milestoneIds.filter((id) => id !== milestone.id);
                                  upsertMaterial(index, { milestoneIds: next });
                                }}
                              />
                              {milestone.name || milestone.code}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <datalist id="material-options">
              {materialsLookup.map((material) => (
                <option key={material.id} value={material.name} />
              ))}
            </datalist>
          </section>
        );
      case 4:
        return (
          <section className="card">
            <h2>Payment plan</h2>
            <button className="button-secondary" onClick={() => setPayments((items) => [...items, emptyPayment()])}>
              Add payment schedule
            </button>
            <div className="list-grid" style={{ marginTop: "1.5rem" }}>
              {payments.map((item, index) => (
                <div key={item.id} className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3>Invoice {index + 1}</h3>
                    {payments.length > 1 && (
                      <button
                        className="button-ghost"
                        onClick={() => setPayments((values) => values.filter((value) => value.id !== item.id))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="list-grid">
                    <div>
                      <label>Invoice number</label>
                      <input
                        value={item.invoiceNo}
                        onChange={(event) => upsertPayment(index, { invoiceNo: event.target.value })}
                        data-error={paymentErrors[item.id]?.invoiceNo ? "true" : undefined}
                      />
                      {paymentErrors[item.id]?.invoiceNo && (
                        <p className="error-text">{paymentErrors[item.id]?.invoiceNo}</p>
                      )}
                    </div>
                    <div>
                      <label>Invoice date</label>
                      <input
                        type="date"
                        value={item.invoiceDate}
                        onChange={(event) => upsertPayment(index, { invoiceDate: event.target.value })}
                        data-error={paymentErrors[item.id]?.invoiceDate ? "true" : undefined}
                      />
                    </div>
                    <div>
                      <label>Amount</label>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(event) => upsertPayment(index, { amount: event.target.value })}
                        data-error={paymentErrors[item.id]?.amount ? "true" : undefined}
                      />
                    </div>
                    <div>
                      <label>Linked milestones</label>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {milestones.map((milestone) => {
                          const checked = item.milestoneIds.includes(milestone.id);
                          return (
                            <label key={milestone.id} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  const next = event.target.checked
                                    ? [...item.milestoneIds, milestone.id]
                                    : item.milestoneIds.filter((id) => id !== milestone.id);
                                  upsertPayment(index, { milestoneIds: next });
                                }}
                              />
                              {milestone.name || milestone.code}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label>Linked materials</label>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {materials.map((material) => {
                          const checked = item.materialCostIds.includes(material.id);
                          return (
                            <label key={material.id} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  const next = event.target.checked
                                    ? [...item.materialCostIds, material.id]
                                    : item.materialCostIds.filter((id) => id !== material.id);
                                  upsertPayment(index, { materialCostIds: next });
                                }}
                              />
                              {material.sku || material.description || material.id}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label>Notes</label>
                      <textarea
                        value={item.notes}
                        onChange={(event) => upsertPayment(index, { notes: event.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 5:
      default:
        return (
          <section className="card">
            <h2>Review</h2>
            <p>Confirm the summary before submitting the project.</p>
            <div className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
              <h3>Basics</h3>
              <ul>
                <li><strong>Name:</strong> {projectBasics.name}</li>
                <li><strong>Client:</strong> {projectBasics.clientName}</li>
                <li><strong>Start:</strong> {projectBasics.startDate || "-"}</li>
                <li><strong>End:</strong> {projectBasics.endDate || "-"}</li>
                <li><strong>Currency:</strong> {projectBasics.currency}</li>
              </ul>
            </div>
            <div className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
              <h3>Milestones ({milestones.length})</h3>
              <ul>
                {milestones.map((milestone) => (
                  <li key={milestone.id}>
                    <strong>{milestone.code}</strong> – {milestone.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
              <h3>Cost lines ({costs.length})</h3>
              <ul>
                {costs.map((cost) => (
                  <li key={cost.id}>
                    {cost.type}: {cost.roleOrSKU} ({cost.qty || 0} @ {cost.rate || 0})
                  </li>
                ))}
              </ul>
            </div>
            <div className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
              <h3>Materials ({materials.length})</h3>
              <ul>
                {materials.map((material) => (
                  <li key={material.id}>
                    {material.sku} – {material.qty || 0} × {material.unitPrice || 0}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card" style={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
              <h3>Payments ({payments.length})</h3>
              <ul>
                {payments.map((payment) => (
                  <li key={payment.id}>
                    {payment.invoiceNo} on {payment.invoiceDate} – {payment.amount || 0}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
    }
  };

  return (
    <main className="container">
      <div className="card">
        <h1>Project setup wizard</h1>
        <p>Complete each step and save a draft at any time. Continue is disabled until required fields are valid.</p>
        {projectId && (
          <p>
            Current project ID: <code>{projectId}</code>
          </p>
        )}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
          {steps.map((step, index) => (
            <span key={step} className={`badge ${index === activeStep ? "" : ""}`}>
              {index + 1}. {step}
            </span>
          ))}
        </div>
      </div>

      {renderStep()}

      <div className="actions">
        <button className="button-secondary" onClick={handlePrev} disabled={activeStep === 0}>
          Back
        </button>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="button-ghost" onClick={() => persist(false)} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save draft"}
          </button>
          {activeStep < steps.length - 1 ? (
            <button
              className="button-primary"
              onClick={handleNext}
              disabled={!isStepValid[activeStep]}
            >
              Continue
            </button>
          ) : (
            <button className="button-primary" onClick={() => persist(true)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
