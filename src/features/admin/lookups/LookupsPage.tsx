"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast";
import {
  addLookupItem,
  deleteLookupItem,
  listLookup,
  updateLookupItem,
  type LookupCollection,
  type LookupItem,
} from "@/lib/repo/lookups";
import { formatError } from "@/lib/errors/format";
import { useProjectAggregates } from "@/lib/hooks/useProjectAggregates";
import { LookupForm, type LookupDraft } from "./components/LookupForm";
import { LookupTable } from "./components/LookupTable";
import { DemoDataActions } from "./components/DemoDataActions";

type Props = {
  projectId: string;
};

const collections: LookupCollection[] = ["roles", "materials", "rateBands"];

type DraftState = Record<LookupCollection, LookupDraft>;
type EditingState = Partial<
  Record<LookupCollection, { id: string; draft: LookupDraft; errors?: Partial<Record<keyof LookupDraft, string>> }>
>;

const emptyDraft: DraftState = {
  roles: { name: "" },
  materials: { name: "" },
  rateBands: { name: "", rate: "" },
};

export function LookupsPage({ projectId }: Props) {
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<LookupCollection, LookupItem[]>>({
    roles: [],
    materials: [],
    rateBands: [],
  });
  const [drafts, setDrafts] = useState<DraftState>(emptyDraft);
  const [editing, setEditing] = useState<EditingState>({});
  const [saving, setSaving] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<LookupCollection, Partial<Record<keyof LookupDraft, string>>>>({
    roles: {},
    materials: {},
    rateBands: {},
  });

  const aggregates = useProjectAggregates(projectId);

  const refresh = useCallback(async () => {
    const loaded = await Promise.all(collections.map((collection) => listLookup(projectId, collection, { force: true })));
    setValues({
      roles: loaded[0],
      materials: loaded[1],
      rateBands: loaded[2],
    });
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        showError(formatError(error));
      })
      .finally(() => setLoading(false));
  }, [refresh, showError]);

  const validate = (collection: LookupCollection, draft: LookupDraft, editingId?: string) => {
    const errors: Partial<Record<keyof LookupDraft, string>> = {};
    if (!draft.name.trim()) {
      errors.name = "Name is required";
    }
    const duplicate = values[collection].some(
      (item) => item.id !== editingId && item.name.trim().toLowerCase() === draft.name.trim().toLowerCase()
    );
    if (duplicate) {
      errors.name = "Name must be unique";
    }
    if (collection === "rateBands") {
      if (!draft.rate || Number.isNaN(Number(draft.rate))) {
        errors.rate = "Enter a numeric rate";
      } else if (Number(draft.rate) < 0) {
        errors.rate = "Rate must be positive";
      }
    }
    return errors;
  };

  const handleCreate = async (collection: LookupCollection) => {
    const draft = drafts[collection];
    const errors = validate(collection, draft);
    if (Object.keys(errors).length > 0) {
      setCreateErrors((current) => ({ ...current, [collection]: errors }));
      showError(Object.values(errors)[0] ?? "Check the form");
      return;
    }
    setCreateErrors((current) => ({ ...current, [collection]: {} }));
    setSaving(true);
    try {
      await addLookupItem(projectId, collection, {
        name: draft.name.trim(),
        rate: collection === "rateBands" ? Number(draft.rate) : undefined,
      });
      setDrafts((current) => ({ ...current, [collection]: { ...emptyDraft[collection] } }));
      await refresh();
      showSuccess("Lookup saved");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError(formatError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (collection: LookupCollection) => {
    const state = editing[collection];
    if (!state) return;
    const baseState = { id: state.id, draft: state.draft };
    const errors = validate(collection, state.draft, state.id);
    if (Object.keys(errors).length > 0) {
      setEditing((current) => ({ ...current, [collection]: { ...baseState, errors } }));
      showError(Object.values(errors)[0] ?? "Check the form");
      return;
    }
    setEditing((current) => ({ ...current, [collection]: baseState }));
    setSaving(true);
    try {
      await updateLookupItem(projectId, collection, state.id, {
        name: state.draft.name.trim(),
        rate: collection === "rateBands" ? Number(state.draft.rate) : undefined,
      });
      setEditing((current) => ({ ...current, [collection]: undefined }));
      await refresh();
      showSuccess("Lookup updated");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError(formatError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (collection: LookupCollection, item: LookupItem) => {
    const confirm = window.confirm(`Delete ${item.name}? This cannot be undone.`);
    if (!confirm) return;

    const inUse = (() => {
      if (aggregates.loading) {
        return true;
      }
      if (collection === "roles") {
        return aggregates.costs.some((cost) => cost.roleOrSKU?.toLowerCase() === item.name.toLowerCase());
      }
      if (collection === "materials") {
        return aggregates.materials.some((material) => material.sku?.toLowerCase() === item.name.toLowerCase());
      }
      return false;
    })();

    if (aggregates.loading) {
      showError("Project data is still loading. Try again shortly.");
      return;
    }

    if (inUse) {
      showError("This value is currently used in project data. Update the records before deleting.");
      return;
    }

    try {
      if (editing[collection]?.id === item.id) {
        setEditing((current) => ({ ...current, [collection]: undefined }));
      }
      await deleteLookupItem(projectId, collection, item.id);
      await refresh();
      showSuccess("Lookup removed");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError(formatError(error));
    }
  };

  const collectionTitle = useMemo(
    () => ({ roles: "Roles", materials: "Materials", rateBands: "Rate bands" }),
    []
  );

  if (loading) {
    return (
      <main className="container">
        <div className="card">
          <p>Loading lookup values...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <DemoDataActions />
      <div className="card">
        <h1>Lookup administration</h1>
        <p>Manage dropdown values used across the costing wizard.</p>
      </div>
      {collections.map((collection) => {
        const editState = editing[collection];
        return (
          <div key={collection} className="card">
            <h2>{collectionTitle[collection]}</h2>
            <LookupForm
              collection={collection}
              value={drafts[collection]}
              onChange={(draft) => {
                setDrafts((current) => ({ ...current, [collection]: draft }));
                setCreateErrors((current) => ({ ...current, [collection]: {} }));
              }}
              onSubmit={() => handleCreate(collection)}
              busy={saving}
              errors={createErrors[collection]}
            />
            {editState && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-muted)" }}>
                <h3>Edit {collection.slice(0, -1)}</h3>
                <LookupForm
                  collection={collection}
                  value={editState.draft}
                  onChange={(draft) =>
                    setEditing((current) => ({ ...current, [collection]: { id: editState.id, draft } }))
                  }
                  onSubmit={() => handleUpdate(collection)}
                  onCancel={() => setEditing((current) => ({ ...current, [collection]: undefined }))}
                  busy={saving}
                  mode="edit"
                  errors={(editErrors[collection] as any)?.errors ?? {}}
                />
              </div>
            )}
            <div style={{ marginTop: "1.5rem" }}>
              <LookupTable
                collection={collection}
                items={values[collection]}
                onEdit={(item) =>
                  setEditing((current) => ({
                    ...current,
                    [collection]: { id: item.id, draft: { name: item.name, rate: item.rate?.toString() ?? "" } },
                  }))
                }
                onDelete={(item) => handleDelete(collection, item)}
              />
            </div>
          </div>
        );
      })}
    </main>
  );
}
