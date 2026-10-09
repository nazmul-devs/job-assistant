import prisma from "@/lib/prisma";
import { AggregatedSyncResult, CandidateProfileData, FetchOptions, JobSource } from "@/types/job";
import { jobSourceRegistry } from "./job-sources";
import { calculateJobMatch, DEFAULT_CANDIDATE_PROFILE } from "./scorer";

export async function getActiveProfile(): Promise<CandidateProfileData> {
  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { id: "default" },
    });
    if (profile) {
      return {
        id: profile.id,
        name: profile.name,
        targetRoles: profile.targetRoles,
        skills: profile.skills,
        minExperienceYears: profile.minExperienceYears,
        remoteOnly: profile.remoteOnly,
        preferredLocations: profile.preferredLocations,
        minSalary: profile.minSalary,
        salaryCurrency: profile.salaryCurrency,
      };
    }
  } catch (err) {
    console.warn("[Ingestion] Could not load profile from DB, using fallback:", err);
  }
  return DEFAULT_CANDIDATE_PROFILE;
}

export async function runJobIngestion(options?: {
  sources?: JobSource[];
  fetchOptions?: FetchOptions;
}): Promise<AggregatedSyncResult> {
  const overallStartTime = Date.now();
  const profile = await getActiveProfile();

  let fetchedJobs;
  let sourceResults;

  if (options?.sources && options.sources.length > 0) {
    const enabledAdapters = options.sources
      .map((s) => jobSourceRegistry.getAdapter(s))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));

    const jobs = [];
    const results = [];
    for (const adapter of enabledAdapters) {
      const sStart = Date.now();
      try {
        const fetched = await adapter.fetchJobs(options.fetchOptions);
        jobs.push(...fetched);
        results.push({
          source: adapter.sourceName,
          success: true,
          fetchedCount: fetched.length,
          savedCount: 0,
          durationMs: Date.now() - sStart,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({
          source: adapter.sourceName,
          success: false,
          fetchedCount: 0,
          savedCount: 0,
          error: msg,
          durationMs: Date.now() - sStart,
        });
      }
    }
    fetchedJobs = jobs;
    sourceResults = results;
  } else {
    const res = await jobSourceRegistry.fetchFromAll(options?.fetchOptions);
    fetchedJobs = res.jobs;
    sourceResults = res.results;
  }

  let totalSaved = 0;
  const savedCountBySource: Record<string, number> = {};

  // Ingest each job safely with upsert to prevent duplicates
  for (const job of fetchedJobs) {
    try {
      const match = calculateJobMatch(job, profile);

      const existing = await prisma.job.findUnique({
        where: { dedupKey: job.dedupKey },
        select: { id: true, status: true },
      });

      if (!existing) {
        await prisma.job.create({
          data: {
            dedupKey: job.dedupKey,
            source: job.source,
            externalId: job.externalId,
            title: job.title,
            company: job.company,
            companyLogo: job.companyLogo,
            location: job.location,
            isRemote: job.isRemote,
            salary: job.salary,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            description: job.description,
            jobUrl: job.jobUrl,
            applyUrl: job.applyUrl,
            postedAt: job.postedAt,
            matchScore: match.totalScore,
            matchDetails: JSON.parse(JSON.stringify(match)),
            status: "NEW",
          },
        });
        totalSaved++;
        savedCountBySource[job.source] = (savedCountBySource[job.source] || 0) + 1;
      } else {
        // Update freshness and match score if profile changed, without overwriting status or user notes
        await prisma.job.update({
          where: { dedupKey: job.dedupKey },
          data: {
            title: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary ?? undefined,
            matchScore: match.totalScore,
            matchDetails: JSON.parse(JSON.stringify(match)),
          },
        });
      }
    } catch (err) {
      console.error(`[Ingestion] Failed to upsert job ${job.dedupKey}:`, err);
    }
  }

  // Update source result counts
  for (const r of sourceResults) {
    r.savedCount = savedCountBySource[r.source] || 0;

    // Record individual source sync log
    try {
      await prisma.syncLog.create({
        data: {
          source: r.source,
          status: r.success ? "SUCCESS" : "FAILED",
          jobsFetched: r.fetchedCount,
          jobsSaved: r.savedCount,
          error: r.error || null,
        },
      });
    } catch {
      // ignore logging errors
    }
  }

  const durationMs = Date.now() - overallStartTime;
  return {
    totalFetched: fetchedJobs.length,
    totalSaved,
    durationMs,
    sources: sourceResults,
  };
}
