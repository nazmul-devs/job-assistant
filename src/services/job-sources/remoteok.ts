import { FetchOptions, JobSourceAdapter, NormalizedJob } from "@/types/job";
import { generateDedupKey } from "@/services/normalizer";
import { fetchWithTimeout } from "./base";

interface RemoteOKJobRaw {
  slug?: string;
  id?: string | number;
  epoch?: string | number;
  date?: string;
  company?: string;
  company_logo?: string;
  logo?: string;
  position?: string;
  tags?: string[];
  description?: string;
  location?: string;
  apply_url?: string;
  url?: string;
  salary_min?: number;
  salary_max?: number;
}

export class RemoteOKAdapter implements JobSourceAdapter {
  readonly sourceName = "RemoteOK" as const;
  readonly displayName = "Remote OK";

  isEnabled(): boolean {
    return true;
  }

  async fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]> {
    const url = "https://remoteok.com/api";

    const res = await fetchWithTimeout(url, {
      timeoutMs: options?.timeoutMs,
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`RemoteOK API returned status ${res.status}: ${res.statusText}`);
    }

    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    // Filter out initial legal/disclaimer item and ensure required fields exist
    const validJobs = (data as RemoteOKJobRaw[]).filter(
      (item) => item && typeof item === "object" && item.position && item.company
    );

    const limit = options?.limit ?? 40;
    const items = validJobs.slice(0, limit);

    return items.map((job) => {
      const externalId = job.id ? String(job.id) : null;
      const jobUrl = job.url || (job.slug ? `https://remoteok.com/remote-jobs/${job.slug}` : "https://remoteok.com");
      const applyUrl = job.apply_url || jobUrl;
      const dedupKey = generateDedupKey(this.sourceName, externalId, jobUrl);

      const sMin = job.salary_min && job.salary_min > 0 ? Number(job.salary_min) : null;
      const sMax = job.salary_max && job.salary_max > 0 ? Number(job.salary_max) : null;
      let salaryStr: string | null = null;
      if (sMin && sMax) {
        salaryStr = `$${sMin.toLocaleString()} - $${sMax.toLocaleString()}`;
      } else if (sMin) {
        salaryStr = `$${sMin.toLocaleString()}+`;
      }

      let postedAt: Date | null = null;
      if (job.date) {
        const parsed = new Date(job.date);
        if (!isNaN(parsed.getTime())) {
          postedAt = parsed;
        }
      } else if (job.epoch) {
        const parsed = new Date(Number(job.epoch) * 1000);
        if (!isNaN(parsed.getTime())) {
          postedAt = parsed;
        }
      }

      return {
        source: this.sourceName,
        externalId,
        dedupKey,
        title: job.position!.trim(),
        company: job.company!.trim(),
        companyLogo: job.company_logo || job.logo || null,
        location: job.location?.trim() || "Worldwide / Remote",
        isRemote: true,
        salary: salaryStr,
        salaryMin: sMin,
        salaryMax: sMax,
        salaryCurrency: sMin || sMax ? "USD" : null,
        description: job.description || `${job.position} at ${job.company}`,
        jobUrl,
        applyUrl,
        postedAt,
      };
    });
  }
}
