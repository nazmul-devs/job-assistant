import { runJobIngestion } from "../src/services/ingestion";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Triggering live job ingestion across all 7 sources...");
  const result = await runJobIngestion({
    fetchOptions: { limit: 10, timeoutMs: 15000 },
  });

  console.log("================ SYNC SUMMARY ================");
  console.log(`Total Fetched: ${result.totalFetched}`);
  console.log(`Total New Saved: ${result.totalSaved}`);
  console.log(`Duration: ${result.durationMs}ms`);
  console.log("Per-Source Results:");
  for (const s of result.sources) {
    console.log(
      `  - ${s.source}: ${s.success ? "SUCCESS" : "FAILED"} (Fetched: ${s.fetchedCount}, Saved: ${s.savedCount})${
        s.error ? ` Error: ${s.error}` : ""
      }`
    );
  }

  const dbCount = await prisma.job.count();
  console.log(`\nTotal Jobs in PostgreSQL database now: ${dbCount}`);

  const topMatches = await prisma.job.findMany({
    take: 5,
    orderBy: { matchScore: "desc" },
    select: {
      title: true,
      company: true,
      source: true,
      matchScore: true,
      dedupKey: true,
    },
  });

  console.log("\nTop 5 Matched Jobs:");
  for (const job of topMatches) {
    console.log(`  [${job.matchScore}%] ${job.title} at ${job.company} (${job.source})`);
  }

  // Testing deduplication: run ingestion again!
  console.log("\nTesting deduplication (running ingestion again with same options)...");
  const secondResult = await runJobIngestion({
    fetchOptions: { limit: 10, timeoutMs: 15000 },
  });
  console.log(`Second Ingestion - Total Saved: ${secondResult.totalSaved} (Expected 0 duplicates inserted)`);

  const secondDbCount = await prisma.job.count();
  console.log(`PostgreSQL job count after second sync: ${secondDbCount} (Should equal previous ${dbCount})`);

  if (secondDbCount === dbCount) {
    console.log("SUCCESS: Zero duplicates inserted! Deduplication verified.");
  } else {
    console.error("WARNING: Duplicate detected!");
  }
}

main()
  .catch((e) => {
    console.error("Error during test sync:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
