import { describe, it, expect } from "vitest";
import { generateDedupKey, normalizeJobUrl } from "@/services/normalizer";
import { NormalizedJob } from "@/types/job";

describe("Duplicate Prevention Strategy", () => {
  it("never produces different dedup keys for repeated job fetches with externalId", () => {
    const rawJob1: Partial<NormalizedJob> = {
      source: "Himalayas",
      externalId: "job-abc-123",
      jobUrl: "https://himalayas.app/jobs/senior-dev",
    };

    const rawJob2: Partial<NormalizedJob> = {
      source: "Himalayas",
      externalId: "job-abc-123",
      jobUrl: "https://himalayas.app/jobs/senior-dev?source=feed&ref=newsletter",
    };

    const key1 = generateDedupKey(rawJob1.source!, rawJob1.externalId, rawJob1.jobUrl!);
    const key2 = generateDedupKey(rawJob2.source!, rawJob2.externalId, rawJob2.jobUrl!);

    expect(key1).toBe(key2);
    expect(key1).toBe("himalayas:id:job-abc-123");
  });

  it("never produces different dedup keys for repeated job fetches without externalId", () => {
    const rawJob1: Partial<NormalizedJob> = {
      source: "WeWorkRemotely",
      externalId: null,
      jobUrl: "https://weworkremotely.com/remote-jobs/company-senior-engineer",
    };

    const rawJob2: Partial<NormalizedJob> = {
      source: "WeWorkRemotely",
      externalId: null,
      jobUrl: "https://weworkremotely.com/remote-jobs/company-senior-engineer?utm_campaign=daily",
    };

    const key1 = generateDedupKey(rawJob1.source!, rawJob1.externalId, rawJob1.jobUrl!);
    const key2 = generateDedupKey(rawJob2.source!, rawJob2.externalId, rawJob2.jobUrl!);

    expect(key1).toBe(key2);
  });

  it("filters out duplicate jobs in a batch stream", () => {
    const incomingJobs = [
      { source: "Jobicy" as const, externalId: "1", jobUrl: "https://jobicy.com/1" },
      { source: "Jobicy" as const, externalId: "2", jobUrl: "https://jobicy.com/2" },
      { source: "Jobicy" as const, externalId: "1", jobUrl: "https://jobicy.com/1?ref=test" }, // duplicate of 1
      { source: "Remotive" as const, externalId: "1", jobUrl: "https://remotive.com/1" }, // different source
    ];

    const seenKeys = new Set<string>();
    const uniqueBatch: typeof incomingJobs = [];

    for (const j of incomingJobs) {
      const key = generateDedupKey(j.source, j.externalId, j.jobUrl);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueBatch.push(j);
      }
    }

    expect(uniqueBatch.length).toBe(3);
    expect(uniqueBatch.map((j) => `${j.source}:${j.externalId}`)).toEqual([
      "Jobicy:1",
      "Jobicy:2",
      "Remotive:1",
    ]);
  });
});
