import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ExecutiveSummarySnapshot } from "./types";

export async function createReportSnapshot(projectId: string, payload: ExecutiveSummarySnapshot) {
  const doc = {
    ...payload,
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, "projects", projectId, "reportSnapshots"), doc);
  return ref.id;
}
