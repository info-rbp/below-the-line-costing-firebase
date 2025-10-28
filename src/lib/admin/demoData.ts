import { randomUUID } from "crypto";
import type { Firestore } from "firebase-admin/firestore";
import { createDemoDataset } from "../demo/demoData";

type SeedOptions = {
  seedLabel?: string;
};

export type SeedSummary = {
  projectId: string;
  seedBatchId: string;
  counts: {
    milestones: number;
    costLineItems: number;
    materialCosts: number;
    paymentSchedules: number;
  };
};

export async function seedDemoProject(
  db: Firestore,
  options: SeedOptions = {}
): Promise<SeedSummary> {
  const dataset = createDemoDataset();
  const seedBatchId = randomUUID();
  const nowIso = new Date().toISOString();
  const projectRef = db.collection("projects").doc();
  const batch = db.batch();

  batch.set(projectRef, {
    ...dataset.project,
    createdAt: nowIso,
    updatedAt: nowIso,
    seeded: true,
    seedBatchId,
    seedLabel: options.seedLabel ?? "phase3-demo",
  });

  for (const milestone of dataset.milestones) {
    const docRef = projectRef.collection("milestones").doc(milestone.id);
    batch.set(docRef, {
      ...milestone,
      createdAt: nowIso,
      seeded: true,
      seedBatchId,
    });
  }

  for (const cost of dataset.costLineItems) {
    const docRef = projectRef.collection("costLineItems").doc(cost.id);
    batch.set(docRef, {
      ...cost,
      createdAt: nowIso,
      seeded: true,
      seedBatchId,
    });
  }

  for (const material of dataset.materialCosts) {
    const docRef = projectRef.collection("materialCosts").doc(material.id);
    batch.set(docRef, {
      ...material,
      createdAt: nowIso,
      seeded: true,
      seedBatchId,
    });
  }

  for (const payment of dataset.paymentSchedules) {
    const docRef = projectRef.collection("paymentSchedules").doc(payment.id);
    batch.set(docRef, {
      ...payment,
      createdAt: nowIso,
      seeded: true,
      seedBatchId,
    });
  }

  await batch.commit();

  return {
    projectId: projectRef.id,
    seedBatchId,
    counts: {
      milestones: dataset.milestones.length,
      costLineItems: dataset.costLineItems.length,
      materialCosts: dataset.materialCosts.length,
      paymentSchedules: dataset.paymentSchedules.length,
    },
  };
}

type ResetOptions = {
  seedBatchId?: string;
};

export type ResetSummary = {
  projectId: string;
  seedBatchId?: string;
};

export async function resetSeededProjects(
  db: Firestore,
  options: ResetOptions = {}
): Promise<ResetSummary[]> {
  let query = db.collection("projects").where("seeded", "==", true);
  if (options.seedBatchId) {
    query = query.where("seedBatchId", "==", options.seedBatchId);
  }
  const snapshot = await query.get();
  if (snapshot.empty) {
    return [];
  }
  const results: ResetSummary[] = [];
  for (const doc of snapshot.docs) {
    await db.recursiveDelete(doc.ref);
    results.push({ projectId: doc.id, seedBatchId: doc.get("seedBatchId") });
  }
  return results;
}
