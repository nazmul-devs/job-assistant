import { FetchOptions, JobSourceAdapter, NormalizedJob } from "@/types/job";
import { generateDedupKey } from "@/services/normalizer";
import { fetchWithTimeout } from "./base";

interface RemoteJobsOrgJobRaw {
  id?: string;
  title?: string;
  url?: string;
  apply_url?: string;
  company?: {
    name?: string;
    logo_url?: string;
  };
  category?: string;
  location?: string;
  locations?: string[];
  salary_min?: number;
  salary_max?: number;
  salary_text?: string;
  salary_currency?: string;
  description?: string;
  posted_at?: string;
}

interface RemoteJobsOrgResponse {
  data?: RemoteJobsOrgJobRaw[];
}

export class RemoteJobsOrgAdapter implements JobSourceAdapter {
  readonly sourceName = "RemoteJobsOrg" as const;
  readonly displayName = "RemoteJobs.org";

  isEnabled(): boolean {
    return true;
  }

  async fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]> {
    const limit = options?.limit ?? 40;
    const url = `https://remotejobs.org/api/v1/jobs?limit=${limit}`;

    const res = await fetchWithTimeout(url, { timeoutMs: options?.timeoutMs });
    if (!res.ok) {
      throw new Error(`RemoteJobs.org API returned status ${res.status}: ${res.statusText}`);
    }

    const data: RemoteJobsOrgResponse = await res.json();
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data
      .filter((job) => job.title && (job.company?.name || typeof job.company === "string"))
      .map((job) => {
        const companyName =
          typeof job.company === "string"
            ? job.company
            : job.company?.name || "Company";
        const companyLogo =
          typeof job.company === "object" ? job.company?.logo_url || null : null;

        const externalId = job.id || null;
        const jobUrl = job.url || "https://remotejobs.org";
        const applyUrl = job.apply_url || jobUrl;
        const dedupKey = generateDedupKey(this.sourceName, externalId, jobUrl);

        let location = "Worldwide";
        if (Array.isArray(job.locations) && job.locations.length > 0) {
          location = job.locations.join(", ");
        } else if (job.location) {
          location = job.location;
        }

        let salaryString = job.salary_text || null;
        if (!salaryString && job.salary_min && job.salary_max) {
          salaryString = `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
        } else if (!salaryString && job.salary_min) {
          salaryString = `$${job.salary_min.toLocaleString()}+`;
        }

        let postedAt: Date | null = null;
        if (job.posted_at) {
          const parsed = new Date(job.posted_at);
          if (!isNaN(parsed.getTime())) {
            postedAt = parsed;
          }
        }

        return {
          source: this.sourceName,
          externalId,
          dedupKey,
          title: job.title!.trim(),
          company: companyName.trim(),
          companyLogo,
          location,
          isRemote: true,
          salary: salaryString,
          salaryMin: job.salary_min || null,
          salaryMax: job.salary_max || null,
          salaryCurrency: job.salary_currency || "USD",
          description: job.description || `${job.title} at ${companyName}`,
          jobUrl,
          applyUrl,
          postedAt,
        };
      });
  }
}
