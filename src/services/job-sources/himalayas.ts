import { FetchOptions, JobSourceAdapter, NormalizedJob } from "@/types/job";
import { generateDedupKey } from "@/services/normalizer";
import { fetchWithTimeout } from "./base";

interface HimalayasJobRaw {
  title?: string;
  excerpt?: string;
  companyName?: string;
  companySlug?: string;
  companyLogo?: string;
  employmentType?: string;
  minSalary?: number;
  maxSalary?: number;
  salaryPeriod?: string;
  currency?: string;
  locationRestrictions?: string[];
  description?: string;
  pubDate?: number | string;
  applicationLink?: string;
  guid?: string;
}

interface HimalayasResponse {
  jobs?: HimalayasJobRaw[];
}

export class HimalayasAdapter implements JobSourceAdapter {
  readonly sourceName = "Himalayas" as const;
  readonly displayName = "Himalayas";

  isEnabled(): boolean {
    return true;
  }

  async fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]> {
    const limit = options?.limit ?? 40;
    const offset = options?.page ? (options.page - 1) * limit : 0;
    const url = `https://himalayas.app/jobs/api?limit=${limit}&offset=${offset}`;

    const res = await fetchWithTimeout(url, { timeoutMs: options?.timeoutMs });
    if (!res.ok) {
      throw new Error(`Himalayas API returned status ${res.status}: ${res.statusText}`);
    }

    const data: HimalayasResponse = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) {
      return [];
    }

    return data.jobs
      .filter((job) => job.title && job.companyName)
      .map((job) => {
        const externalId = job.guid || null;
        const jobUrl =
          job.applicationLink ||
          (job.companySlug ? `https://himalayas.app/companies/${job.companySlug}/jobs` : "https://himalayas.app");
        const applyUrl = job.applicationLink || jobUrl;

        let salaryString: string | null = null;
        if (job.minSalary && job.maxSalary) {
          salaryString = `${job.currency || "$"}${job.minSalary.toLocaleString()} - ${job.currency || "$"}${job.maxSalary.toLocaleString()} / ${job.salaryPeriod || "yr"}`;
        } else if (job.minSalary) {
          salaryString = `${job.currency || "$"}${job.minSalary.toLocaleString()} / ${job.salaryPeriod || "yr"}`;
        }

        const dedupKey = generateDedupKey(this.sourceName, externalId, jobUrl);

        let postedAt: Date | null = null;
        if (job.pubDate) {
          const parsed = typeof job.pubDate === "number" ? new Date(job.pubDate * 1000) : new Date(job.pubDate);
          if (!isNaN(parsed.getTime())) {
            postedAt = parsed;
          }
        }

        return {
          source: this.sourceName,
          externalId,
          dedupKey,
          title: job.title!.trim(),
          company: job.companyName!.trim(),
          companyLogo: job.companyLogo || null,
          location: job.locationRestrictions && job.locationRestrictions.length > 0
            ? job.locationRestrictions.join(", ")
            : "Remote / Worldwide",
          isRemote: true,
          salary: salaryString,
          salaryMin: job.minSalary || null,
          salaryMax: job.maxSalary || null,
          salaryCurrency: job.currency || null,
          description: job.description || job.excerpt || `${job.title} at ${job.companyName}`,
          jobUrl,
          applyUrl,
          postedAt,
        };
      });
  }
}
