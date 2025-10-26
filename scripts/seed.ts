import { getAdminDb, closeAdminApp } from "../src/lib/firebase/admin";
import { seedDemoProject } from "../src/lib/admin/demoData";

async function seed() {
  const db = getAdminDb();
  const summary = await seedDemoProject(db);

  console.log(`\n🌱 Seeding demo project (batch ${summary.seedBatchId})`);
  console.log(`   • Created project ${summary.projectId}`);
  console.log(`   • Seeded ${summary.counts.milestones} milestones`);
  console.log(`   • Seeded ${summary.counts.costLineItems} cost line items`);
  console.log(`   • Seeded ${summary.counts.materialCosts} material costs`);
  console.log(`   • Seeded ${summary.counts.paymentSchedules} payment schedule entries`);
  console.log(`\n✅ Seed complete for project ${summary.projectId}`);
}

seed()
  .catch((error) => {
    console.error("\n❌ Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeAdminApp();
  });
