import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cachedApp: App | undefined;
let cachedDb: Firestore | undefined;

function loadServiceAccount(): ServiceAccount | undefined {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    const absolute = resolve(credentialsPath);
    const file = readFileSync(absolute, "utf8");
    return JSON.parse(file);
  }
  return undefined;
}

export function getAdminApp(): App {
  if (cachedApp) {
    return cachedApp;
  }
  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return existing;
  }
  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    cachedApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id ?? process.env.FIREBASE_PROJECT_ID,
    });
    return cachedApp;
  }
  cachedApp = initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  return cachedApp;
}

export function getAdminDb(): Firestore {
  if (cachedDb) {
    return cachedDb;
  }
  const app = getAdminApp();
  cachedDb = getFirestore(app);
  return cachedDb;
}

export async function closeAdminApp() {
  if (cachedApp) {
    await getApp().delete();
    cachedApp = undefined;
    cachedDb = undefined;
  }
}
