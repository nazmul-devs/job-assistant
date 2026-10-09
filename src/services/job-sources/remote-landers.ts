import { FetchOptions, JobSourceAdapter, NormalizedJob } from "@/types/job";
import { generateDedupKey } from "@/services/normalizer";
import { fetchWithTimeout } from "./base";

interface RemoteLandersJobRaw {
  slug?: string;
  title?: string;
  company?: string;
  companyWebsite?: string;
  category?: string;
  location?: string;
  type?: string;
  level?: string;
  salary?: string;
  postedDate?: string;
  createdAt?: string;
  url?: string;
  applyUrl?: string;
  description?: string;
}

interface RemoteLandersResponse {
  jobs?: RemoteLandersJobRaw[];
}

export class RemoteLandersAdapter implements JobSourceAdapter {
  readonly sourceName = "RemoteLanders" as const;
  readonly displayName = "Remote Landers";

  isEnabled(): boolean {
    return true;
  }

  async fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]> {
    const limit = options?.limit ?? 40;
    const page = options?.page ?? 1;
    const url = `https://remotelanders.com/api/jobs?limit=${limit}&page=${page}`;

    const res = await fetchWithTimeout(url, { timeoutMs: options?.timeoutMs });
    if (!res.ok) {
      throw new Error(`Remote Landers API returned status ${res.status}: ${res.statusText}`);
    }

    const data: RemoteLandersResponse = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) {
      return [];
    }

    return data.jobs
      .filter((job) => job.title && job.company)
      .map((job) => {
        const externalId = job.slug || null;
        const jobUrl = job.url || (job.slug ? `https://remotelanders.com/jobs/${job.slug}` : "https://remotelanders.com");
        const applyUrl = job.applyUrl || job.url || jobUrl;
        const dedupKey = generateDedupKey(this.sourceName, externalId, jobUrl);

        let postedAt: Date | null = null;
        const dateStr = job.postedDate || job.createdAt;
        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            postedAt = parsed;
          }
        }

        return {
          source: this.sourceName,
          externalId,
          dedupKey,
          title: job.title!.trim(),
          company: job.company!.trim(),
          companyLogo: null,
          location: job.location || "Remote / Worldwide",
          isRemote: true,
          salary: job.salary || null,
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: null,
          description: job.description || `${job.title} at ${job.company}. Level: ${job.level || "Standard"}. Category: ${job.category || "Tech"}.`,
          jobUrl,
          applyUrl,
          postedAt,
        };
      });
  }
}
