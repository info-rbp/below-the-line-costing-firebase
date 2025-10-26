import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { resetSeededProjects, seedDemoProject } from "@/lib/admin/demoData";

type AdminActionBody = {
  action?: "seed" | "reset";
  seedBatchId?: string;
};

function parseAdminBody(value: unknown): AdminActionBody {
  if (!value || typeof value !== "object") return {} as AdminActionBody;
  const record = value as Record<string, unknown>;
  const action = record["action"];
  const seedBatchId = record["seedBatchId"];
  return {
    action: action === "seed" || action === "reset" ? action : undefined,
    seedBatchId: typeof seedBatchId === "string" && seedBatchId.length > 0 ? seedBatchId : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const body: AdminActionBody = parseAdminBody(await request.json().catch(() => null));
    const { action, seedBatchId } = body;
    const db = getAdminDb();

    if (action === "seed") {
      const summary = await seedDemoProject(db);
      return NextResponse.json({ status: "ok", summary });
    }

    if (action === "reset") {
      const summaries = await resetSeededProjects(db, seedBatchId ? { seedBatchId } : {});
      return NextResponse.json({ status: "ok", summaries });
    }

    return NextResponse.json({ status: "error", message: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
