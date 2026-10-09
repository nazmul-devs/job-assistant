import { describe, it, expect } from "vitest";
import { jobSourceRegistry } from "@/services/job-sources";
import { generateDedupKey } from "@/services/normalizer";

describe("Job Source Registry & Adapters", () => {
  it("has all 10 required modular adapters registered and enabled", () => {
    const adapters = jobSourceRegistry.getAllAdapters();
    expect(adapters.length).toBe(10);

    const sourceNames = adapters.map((a) => a.sourceName);
    expect(sourceNames).toContain("Himalayas");
    expect(sourceNames).toContain("Remotive");
    expect(sourceNames).toContain("Jobicy");
    expect(sourceNames).toContain("RemoteJobsOrg");
    expect(sourceNames).toContain("RemoteLanders");
    expect(sourceNames).toContain("Arbeitnow");
    expect(sourceNames).toContain("WeWorkRemotely");
    expect(sourceNames).toContain("RemoteOK");
    expect(sourceNames).toContain("WorkingNomads");
    expect(sourceNames).toContain("LaraJobs");
  });

  it("each adapter implements JobSourceAdapter interface cleanly", () => {
    for (const adapter of jobSourceRegistry.getAllAdapters()) {
      expect(typeof adapter.sourceName).toBe("string");
      expect(typeof adapter.displayName).toBe("string");
      expect(typeof adapter.isEnabled).toBe("function");
      expect(typeof adapter.fetchJobs).toBe("function");
      expect(adapter.isEnabled()).toBe(true);
    }
  });

  it("generates collision-free keys across distinct sources with same IDs", () => {
    const keyHimalayas = generateDedupKey("Himalayas", "101", "https://himalayas.app/job/101");
    const keyJobicy = generateDedupKey("Jobicy", "101", "https://jobicy.com/job/101");
    const keyArbeitnow = generateDedupKey("Arbeitnow", "101", "https://arbeitnow.com/job/101");
    const keyRemoteOK = generateDedupKey("RemoteOK", "101", "https://remoteok.com/job/101");
    const keyWorkingNomads = generateDedupKey("WorkingNomads", "101", "https://workingnomads.com/job/101");
    const keyLaraJobs = generateDedupKey("LaraJobs", "101", "https://larajobs.com/job/101");

    expect(keyHimalayas).not.toBe(keyJobicy);
    expect(keyJobicy).not.toBe(keyArbeitnow);
    expect(keyRemoteOK).not.toBe(keyWorkingNomads);
    expect(keyWorkingNomads).not.toBe(keyLaraJobs);
  });
});
