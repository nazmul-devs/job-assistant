import { FetchOptions, JobSourceAdapter, NormalizedJob } from "@/types/job";
import { generateDedupKey } from "@/services/normalizer";
import { fetchWithTimeout } from "./base";

interface ArbeitnowJobRaw {
  slug?: string;
  title?: string;
  company_name?: string;
  remote?: boolean;
  url?: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  description?: string;
  created_at?: number;
}

interface ArbeitnowResponse {
  data?: ArbeitnowJobRaw[];
}

export class ArbeitnowAdapter implements JobSourceAdapter {
  readonly sourceName = "Arbeitnow" as const;
  readonly displayName = "Arbeitnow";

  isEnabled(): boolean {
    return true;
  }

  async fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]> {
    const page = options?.page ?? 1;
    const url = `https://www.arbeitnow.com/api/job-board-api?page=${page}`;

    const res = await fetchWithTimeout(url, { timeoutMs: options?.timeoutMs });
    if (!res.ok) {
      throw new Error(`Arbeitnow API returned status ${res.status}: ${res.statusText}`);
    }

    const data: ArbeitnowResponse = await res.json();
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    const limit = options?.limit ?? 40;
    const items = data.data.slice(0, limit);

    return items
      .filter((job) => job.title && job.company_name)
      .map((job) => {
        const externalId = job.slug || null;
        const jobUrl = job.url || (job.slug ? `https://www.arbeitnow.com/jobs/${job.slug}` : "https://www.arbeitnow.com");
        const applyUrl = job.url || jobUrl;
        const dedupKey = generateDedupKey(this.sourceName, externalId, jobUrl);

        const isRemote = job.remote === true || (job.location ? job.location.toLowerCase().includes("remote") : false);

        let postedAt: Date | null = null;
        if (job.created_at) {
          const parsed = new Date(job.created_at * 1000);
          if (!isNaN(parsed.getTime())) {
            postedAt = parsed;
          }
        }

        return {
          source: this.sourceName,
          externalId,
          dedupKey,
          title: job.title!.trim(),
          company: job.company_name!.trim(),
          companyLogo: null,
          location: job.location || (isRemote ? "Remote" : "Global"),
          isRemote,
          salary: null,
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: null,
          description: job.description || `${job.title} at ${job.company_name}`,
          jobUrl,
          applyUrl,
          postedAt,
        };
      });
  }
}
