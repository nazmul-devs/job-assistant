import { describe, it, expect } from "vitest";
import { ApplicationStatus } from "@/types/job";

describe("Date Filtering Logic", () => {
  function getCutoffDate(range: string): Date | null {
    let days = 0;
    if (range === "today" || range === "24h") days = 1;
    else if (range === "2days" || range === "48h") days = 2;
    else if (range === "week" || range === "7days") days = 7;
    else if (range === "14days") days = 14;
    else if (range === "month" || range === "30days") days = 30;

    if (days === 0) return null;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  function isJobWithinRange(postedAt: Date, range: string): boolean {
    const cutoff = getCutoffDate(range);
    if (!cutoff) return true;
    return postedAt.getTime() >= cutoff.getTime();
  }

  it("filters jobs correctly for today (24h)", () => {
    const now = new Date();
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);

    expect(isJobWithinRange(tenHoursAgo, "today")).toBe(true);
    expect(isJobWithinRange(thirtyHoursAgo, "today")).toBe(false);
  });

  it("filters jobs correctly for last 2 days (48h)", () => {
    const now = new Date();
    const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    expect(isJobWithinRange(thirtyHoursAgo, "2days")).toBe(true);
    expect(isJobWithinRange(threeDaysAgo, "2days")).toBe(false);
  });

  it("filters jobs correctly for last week (7 days)", () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const nineDaysAgo = new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000);

    expect(isJobWithinRange(fiveDaysAgo, "week")).toBe(true);
    expect(isJobWithinRange(nineDaysAgo, "week")).toBe(false);
  });
});

describe("Safe Job Cleanup Policy", () => {
  const PROTECTED_STATUSES: ApplicationStatus[] = [
    "SAVED",
    "APPLY",
    "APPLIED",
    "INTERVIEW",
    "TECHNICAL_INTERVIEW",
    "FINAL_INTERVIEW",
    "OFFER",
    "SELECTED",
  ];

  interface MockJob {
    id: string;
    status: ApplicationStatus;
    postedAt: Date;
  }

  function filterJobsForDeletion(
    jobs: MockJob[],
    olderThanDays: number,
    statuses: ApplicationStatus[],
    keepActiveApplications: boolean
  ): MockJob[] {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    return jobs.filter((job) => {
      // Must be older than cutoff
      if (job.postedAt.getTime() >= cutoff.getTime()) {
        return false;
      }
      // Status must match
      if (statuses.length > 0 && !statuses.includes(job.status)) {
        return false;
      }
      // If safeguard enabled, protected status jobs are NEVER deleted
      if (keepActiveApplications && PROTECTED_STATUSES.includes(job.status)) {
        return false;
      }
      return true;
    });
  }

  it("safely protects active applications from bulk deletion", () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const testJobs: MockJob[] = [
      { id: "1", status: "NEW", postedAt: tenDaysAgo },
      { id: "2", status: "SAVED", postedAt: tenDaysAgo },
      { id: "3", status: "APPLIED", postedAt: tenDaysAgo },
      { id: "4", status: "INTERVIEW", postedAt: tenDaysAgo },
      { id: "5", status: "REJECTED", postedAt: tenDaysAgo },
    ];

    const toDelete = filterJobsForDeletion(
      testJobs,
      7,
      ["NEW", "REJECTED", "WITHDRAWN"],
      true
    );

    const deletedIds = toDelete.map((j) => j.id);
    expect(deletedIds).toContain("1"); // NEW
    expect(deletedIds).toContain("5"); // REJECTED
    expect(deletedIds).not.toContain("2"); // SAVED protected
    expect(deletedIds).not.toContain("3"); // APPLIED protected
    expect(deletedIds).not.toContain("4"); // INTERVIEW protected
  });

  it("does not delete recent jobs within cutoff threshold", () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const testJobs: MockJob[] = [
      { id: "1", status: "NEW", postedAt: threeDaysAgo },
    ];

    const toDelete = filterJobsForDeletion(
      testJobs,
      7,
      ["NEW"],
      true
    );

    expect(toDelete.length).toBe(0);
  });
});
