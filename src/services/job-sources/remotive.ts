import { FetchOptions, JobSourceAdapter, NormalizedJob } from "@/types/job";
import { generateDedupKey } from "@/services/normalizer";
import { fetchWithTimeout } from "./base";

interface RemotiveJobRaw {
  id?: number | string;
  url?: string;
  title?: string;
  company_name?: string;
  company_logo?: string;
  company_logo_url?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
}

interface RemotiveResponse {
  jobs?: RemotiveJobRaw[];
}

export class RemotiveAdapter implements JobSourceAdapter {
  readonly sourceName = "Remotive" as const;
  readonly displayName = "Remotive";

  isEnabled(): boolean {
    return true;
  }

  async fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]> {
    const limit = options?.limit ?? 40;
    // Remotive provides category or limit
    const url = `https://remotive.com/api/remote-jobs?limit=${limit}`;

    const res = await fetchWithTimeout(url, { timeoutMs: options?.timeoutMs });
    if (!res.ok) {
      throw new Error(`Remotive API returned status ${res.status}: ${res.statusText}`);
    }

    const data: RemotiveResponse = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) {
      return [];
    }

    return data.jobs
      .filter((job) => job.title && job.company_name)
      .map((job) => {
        const externalId = job.id ? String(job.id) : null;
        const jobUrl = job.url || "https://remotive.com";
        const applyUrl = job.url || jobUrl;
        const dedupKey = generateDedupKey(this.sourceName, externalId, jobUrl);

        let postedAt: Date | null = null;
        if (job.publication_date) {
          const parsed = new Date(job.publication_date);
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
          companyLogo: job.company_logo || job.company_logo_url || null,
          location: job.candidate_required_location || "Worldwide",
          isRemote: true,
          salary: job.salary || null,
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
