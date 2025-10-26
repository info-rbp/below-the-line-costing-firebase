import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import type { CostLineItem, MaterialCost } from "@/types/domain";

export async function listCostLineItems(projectId: string) {
  const col = collection(db, "projects", projectId, "costLineItems");
  const res = await getDocs(col);
  return res.docs.map((snap) => ({ id: snap.id, ...snap.data() })) as CostLineItem[];
}

export async function listMaterialCosts(projectId: string) {
  const col = collection(db, "projects", projectId, "materialCosts");
  const res = await getDocs(col);
  return res.docs.map((snap) => ({ id: snap.id, ...snap.data() })) as MaterialCost[];
}

export async function addCostLineItem(
  projectId: string,
  input: Omit<CostLineItem, "id" | "createdAt">
) {
  const col = collection(db, "projects", projectId, "costLineItems");
  const now = new Date().toISOString();
  const ref = await addDoc(col, { ...input, createdAt: now });
  return ref.id;
}

export async function addMaterialCost(
  projectId: string,
  input: Omit<MaterialCost, "id" | "createdAt">
) {
  const col = collection(db, "projects", projectId, "materialCosts");
  const now = new Date().toISOString();
  const ref = await addDoc(col, { ...input, createdAt: now });
  return ref.id;
}

export async function setCostLineItem(
  projectId: string,
  costId: string,
  input: Omit<CostLineItem, "id">
) {
  const ref = doc(db, "projects", projectId, "costLineItems", costId);
  await setDoc(ref, input, { merge: true });
}

export async function setMaterialCost(
  projectId: string,
  materialId: string,
  input: Omit<MaterialCost, "id">
) {
  const ref = doc(db, "projects", projectId, "materialCosts", materialId);
  await setDoc(ref, input, { merge: true });
}

export async function removeCostLineItemsNotIn(projectId: string, keepIds: string[]) {
  const col = collection(db, "projects", projectId, "costLineItems");
  const res = await getDocs(col);
  const promises = res.docs
    .filter((docSnap) => !keepIds.includes(docSnap.id))
    .map((docSnap) => deleteDoc(docSnap.ref));
  await Promise.all(promises);
}

export async function removeMaterialCostsNotIn(projectId: string, keepIds: string[]) {
  const col = collection(db, "projects", projectId, "materialCosts");
  const res = await getDocs(col);
  const promises = res.docs
    .filter((docSnap) => !keepIds.includes(docSnap.id))
    .map((docSnap) => deleteDoc(docSnap.ref));
  await Promise.all(promises);
}
