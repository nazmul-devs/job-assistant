import { FetchOptions, JobSourceAdapter, NormalizedJob } from "@/types/job";
import { generateDedupKey } from "@/services/normalizer";
import { fetchWithTimeout } from "./base";

interface JobicyJobRaw {
  id?: number | string;
  url?: string;
  jobSlug?: string;
  jobTitle?: string;
  companyName?: string;
  companyLogo?: string;
  jobIndustry?: string;
  jobType?: string;
  jobGeo?: string;
  jobLevel?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
}

interface JobicyResponse {
  jobs?: JobicyJobRaw[];
}

export class JobicyAdapter implements JobSourceAdapter {
  readonly sourceName = "Jobicy" as const;
  readonly displayName = "Jobicy";

  isEnabled(): boolean {
    return true;
  }

  async fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]> {
    const limit = options?.limit ?? 40;
    const url = `https://jobicy.com/api/v2/remote-jobs?count=${limit}&industry=dev`;

    const res = await fetchWithTimeout(url, { timeoutMs: options?.timeoutMs });
    if (!res.ok) {
      throw new Error(`Jobicy API returned status ${res.status}: ${res.statusText}`);
    }

    const data: JobicyResponse = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) {
      return [];
    }

    return data.jobs
      .filter((job) => job.jobTitle && job.companyName)
      .map((job) => {
        const externalId = job.id ? String(job.id) : null;
        const jobUrl = job.url || "https://jobicy.com";
        const applyUrl = job.url || jobUrl;
        const dedupKey = generateDedupKey(this.sourceName, externalId, jobUrl);

        const sMin = job.salaryMin || job.annualSalaryMin || null;
        const sMax = job.salaryMax || job.annualSalaryMax || null;
        let salaryStr: string | null = null;
        if (sMin && sMax) {
          salaryStr = `${job.salaryCurrency || "$"}${sMin.toLocaleString()} - ${job.salaryCurrency || "$"}${sMax.toLocaleString()}`;
        } else if (sMin) {
          salaryStr = `${job.salaryCurrency || "$"}${sMin.toLocaleString()}`;
        }

        let postedAt: Date | null = null;
        if (job.pubDate) {
          const parsed = new Date(job.pubDate);
          if (!isNaN(parsed.getTime())) {
            postedAt = parsed;
          }
        }

        return {
          source: this.sourceName,
          externalId,
          dedupKey,
          title: job.jobTitle!.trim(),
          company: job.companyName!.trim(),
          companyLogo: job.companyLogo || null,
          location: job.jobGeo || "Worldwide",
          isRemote: true,
          salary: salaryStr,
          salaryMin: sMin,
          salaryMax: sMax,
          salaryCurrency: job.salaryCurrency || null,
          description: job.jobDescription || job.jobExcerpt || `${job.jobTitle} at ${job.companyName}`,
          jobUrl,
          applyUrl,
          postedAt,
        };
      });
  }
}
