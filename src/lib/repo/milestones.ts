import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  orderBy,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import type { Milestone } from "@/types/domain";

export async function listMilestones(projectId: string) {
  const col = collection(db, "projects", projectId, "milestones");
  const q = query(col, orderBy("sortIndex", "asc"));
  const res = await getDocs(q);
  return res.docs.map((d) => ({ id: d.id, ...d.data() })) as Milestone[];
}

export async function addMilestone(
  projectId: string,
  input: Omit<Milestone, "id" | "createdAt">
) {
  const col = collection(db, "projects", projectId, "milestones");
  const now = new Date().toISOString();
  const ref = await addDoc(col, { ...input, createdAt: now });
  return ref.id;
}

export async function setMilestone(
  projectId: string,
  milestoneId: string,
  input: Omit<Milestone, "id">
) {
  const ref = doc(db, "projects", projectId, "milestones", milestoneId);
  await setDoc(ref, input, { merge: true });
}

export async function removeMilestonesNotIn(
  projectId: string,
  keepIds: string[]
) {
  const col = collection(db, "projects", projectId, "milestones");
  const res = await getDocs(col);
  const promises = res.docs
    .filter((docSnap) => !keepIds.includes(docSnap.id))
    .map((docSnap) => deleteDoc(docSnap.ref));
  await Promise.all(promises);
}
