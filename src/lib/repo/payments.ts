import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import type { PaymentSchedule } from "@/types/domain";

export async function listPayments(projectId: string) {
  const col = collection(db, "projects", projectId, "paymentSchedules");
  const res = await getDocs(col);
  return res.docs.map((snap) => ({ id: snap.id, ...snap.data() })) as PaymentSchedule[];
}

export async function addPayment(
  projectId: string,
  input: Omit<PaymentSchedule, "id" | "createdAt">
) {
  const col = collection(db, "projects", projectId, "paymentSchedules");
  const now = new Date().toISOString();
  const ref = await addDoc(col, { ...input, createdAt: now });
  return ref.id;
}

export async function setPayment(
  projectId: string,
  paymentId: string,
  input: Omit<PaymentSchedule, "id">
) {
  const ref = doc(db, "projects", projectId, "paymentSchedules", paymentId);
  await setDoc(ref, input, { merge: true });
}

export async function removePaymentsNotIn(projectId: string, keepIds: string[]) {
  const col = collection(db, "projects", projectId, "paymentSchedules");
  const res = await getDocs(col);
  const promises = res.docs
    .filter((docSnap) => !keepIds.includes(docSnap.id))
    .map((docSnap) => deleteDoc(docSnap.ref));
  await Promise.all(promises);
}
