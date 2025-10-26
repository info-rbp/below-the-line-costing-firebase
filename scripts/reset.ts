import { resetSeededProjects } from "../src/lib/admin/demoData";
import { getAdminDb, closeAdminApp } from "../src/lib/firebase/admin";

function parseArgs() {
  const args = process.argv.slice(2);
  const batchIndex = args.indexOf("--batch");
  if (batchIndex >= 0 && args[batchIndex + 1]) {
    return args[batchIndex + 1];
  }
  return undefined;
}

async function reset() {
  const db = getAdminDb();
  const batchFilter = parseArgs();
  if (batchFilter) {
    console.log(`\n🧹 Resetting seed batch ${batchFilter}`);
  } else {
    console.log("\n🧹 Resetting all seeded demo data");
  }

  const results = await resetSeededProjects(db, batchFilter ? { seedBatchId: batchFilter } : {});

  if (results.length === 0) {
    console.log("   • No seeded projects found");
    return;
  }

  for (const summary of results) {
    console.log(`   • Removed project ${summary.projectId} (batch ${summary.seedBatchId ?? "unknown"})`);
  }

  console.log("\n✅ Reset complete");
}

reset()
  .catch((error) => {
    console.error("\n❌ Reset failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeAdminApp();
  });
