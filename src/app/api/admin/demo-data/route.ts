import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { resetSeededProjects, seedDemoProject } from "@/lib/admin/demoData";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const db = getAdminDb();

    if (action === "seed") {
      const summary = await seedDemoProject(db);
      return NextResponse.json({ status: "ok", summary });
    }

    if (action === "reset") {
      const summaries = await resetSeededProjects(db, body?.seedBatchId ? { seedBatchId: body.seedBatchId } : {});
      return NextResponse.json({ status: "ok", summaries });
    }

    return NextResponse.json({ status: "error", message: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
