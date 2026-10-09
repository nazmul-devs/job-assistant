import prisma from "../src/lib/prisma";

async function check() {
  const jobs = await prisma.job.findMany({
    select: { id: true, source: true, dedupKey: true, externalId: true, title: true, createdAt: true },
  });
  console.log("Total jobs in DB:", jobs.length);
  const bySource: Record<string, number> = {};
  for (const j of jobs) {
    bySource[j.source] = (bySource[j.source] || 0) + 1;
  }
  console.log("Counts by source:", bySource);

  // Group by title and company to see if different dedupKeys were generated
  const titleMap = new Map<string, typeof jobs>();
  for (const j of jobs) {
    const key = `${j.source} | ${j.title}`;
    const list = titleMap.get(key) || [];
    list.push(j);
    titleMap.set(key, list);
  }

  let dupTitleCount = 0;
  for (const [key, list] of titleMap.entries()) {
    if (list.length > 1) {
      dupTitleCount++;
      console.log(`Multiple entries for "${key}":`);
      for (const item of list) {
        console.log(`   id: ${item.id}, dedupKey: ${item.dedupKey}, created: ${item.createdAt}`);
      }
    }
  }
  console.log("Duplicate titles count:", dupTitleCount);
}

check().finally(() => prisma.$disconnect());
