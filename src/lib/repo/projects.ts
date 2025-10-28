import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import type { Project } from "@/types/domain";

const PROJECT_COLLECTION = "projects";

export async function createProject(
  input: Omit<Project, "id" | "createdAt" | "updatedAt">
) {
  const col = collection(db, PROJECT_COLLECTION);
  const now = new Date().toISOString();
  const ref = await addDoc(col, {
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateProject(
  projectId: string,
  input: Partial<Omit<Project, "id" | "createdAt">>
) {
  const ref = doc(db, PROJECT_COLLECTION, projectId);
  await updateDoc(ref, {
    ...input,
    updatedAt: new Date().toISOString(),
  });
}

export async function setProject(
  projectId: string,
  input: Omit<Project, "id">
) {
  const ref = doc(db, PROJECT_COLLECTION, projectId);
  await setDoc(ref, input, { merge: true });
}

export async function getProject(projectId: string) {
  const ref = doc(db, PROJECT_COLLECTION, projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Project not found");
  return { id: snap.id, ...snap.data() } as Project;
}

export async function listProjects() {
  const col = collection(db, PROJECT_COLLECTION);
  const res = await getDocs(col);
  return res.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as Project[];
}
