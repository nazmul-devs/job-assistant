import { FetchOptions, JobSourceAdapter, NormalizedJob } from "@/types/job";
import { generateDedupKey } from "@/services/normalizer";
import { fetchWithTimeout } from "./base";

interface WorkingNomadsJobRaw {
  url?: string;
  title?: string;
  description?: string;
  company_name?: string;
  category_name?: string;
  tags?: string;
  location?: string;
  pub_date?: string;
}

export class WorkingNomadsAdapter implements JobSourceAdapter {
  readonly sourceName = "WorkingNomads" as const;
  readonly displayName = "Working Nomads";

  isEnabled(): boolean {
    return true;
  }

  async fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]> {
    const url = "https://www.workingnomads.com/api/exposed_jobs/";

    const res = await fetchWithTimeout(url, {
      timeoutMs: options?.timeoutMs,
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`WorkingNomads API returned status ${res.status}: ${res.statusText}`);
    }

    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    const validJobs = (data as WorkingNomadsJobRaw[]).filter(
      (item) => item && typeof item === "object" && item.title && item.company_name
    );

    const limit = options?.limit ?? 40;
    const items = validJobs.slice(0, limit);

    return items.map((job) => {
      const jobUrl = job.url || "https://www.workingnomads.com";
      const applyUrl = jobUrl;

      // Extract numeric ID from url like https://www.workingnomads.com/job/go/1925654/
      const match = jobUrl.match(/\/(\d+)\/?$/);
      const externalId = match ? match[1] : null;
      const dedupKey = generateDedupKey(this.sourceName, externalId, jobUrl);

      let postedAt: Date | null = null;
      if (job.pub_date) {
        const parsed = new Date(job.pub_date);
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
        location: job.location?.trim() || "Remote / Anywhere",
        isRemote: true,
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
