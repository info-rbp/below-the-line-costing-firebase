import { db } from "@/lib/firebase/client";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

export type LookupCollection = "roles" | "materials" | "rateBands";

export type LookupItem = {
  id: string;
  name: string;
  rate?: number;
};

const cache = new Map<string, LookupItem[]>();

const cacheKey = (projectId: string, name: LookupCollection) => `${projectId}:${name}`;

const normaliseDoc = (id: string, data: Record<string, unknown>): LookupItem => {
  const name = (data.name as string) ?? (data.value as string) ?? "";
  const rateValue = typeof data.rate === "number" ? data.rate : Number(data.rate ?? NaN);
  return {
    id,
    name,
    rate: Number.isFinite(rateValue) ? rateValue : undefined,
  };
};

export async function listLookup(projectId: string, name: LookupCollection, opts: { force?: boolean } = {}): Promise<LookupItem[]> {
  const key = cacheKey(projectId, name);
  if (!opts.force && cache.has(key)) {
    return cache.get(key)!;
  }
  const col = collection(db, "projects", projectId, "lookups", name, "items");
  const res = await getDocs(col);
  const items = res.docs.map((snap) => normaliseDoc(snap.id, snap.data() as Record<string, unknown>));
  cache.set(key, items);
  return items;
}

export async function addLookupItem(projectId: string, name: LookupCollection, payload: { name: string; rate?: number }) {
  const col = collection(db, "projects", projectId, "lookups", name, "items");
  const docRef = await addDoc(col, { name: payload.name, value: payload.name, rate: payload.rate ?? null });
  cache.delete(cacheKey(projectId, name));
  return docRef.id;
}

export async function updateLookupItem(
  projectId: string,
  name: LookupCollection,
  itemId: string,
  payload: { name: string; rate?: number | null }
) {
  const ref = doc(db, "projects", projectId, "lookups", name, "items", itemId);
  await updateDoc(ref, { name: payload.name, value: payload.name, rate: payload.rate ?? null });
  cache.delete(cacheKey(projectId, name));
}

export async function deleteLookupItem(projectId: string, name: LookupCollection, itemId: string) {
  const ref = doc(db, "projects", projectId, "lookups", name, "items", itemId);
  await deleteDoc(ref);
  cache.delete(cacheKey(projectId, name));
}

export function primeLookupCache(projectId: string, name: LookupCollection, items: LookupItem[]) {
  cache.set(cacheKey(projectId, name), items);
}

export function clearLookupCache(projectId: string, name?: LookupCollection) {
  if (name) {
    cache.delete(cacheKey(projectId, name));
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${projectId}:`)) {
      cache.delete(key);
    }
  }
}
