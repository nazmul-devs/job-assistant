import { XMLParser } from "fast-xml-parser";
import { FetchOptions, JobSourceAdapter, NormalizedJob } from "@/types/job";
import { generateDedupKey } from "@/services/normalizer";
import { fetchWithTimeout } from "./base";

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  guid?: string | { "#text"?: string };
  region?: string;
  category?: string;
}

export class WeWorkRemotelyAdapter implements JobSourceAdapter {
  readonly sourceName = "WeWorkRemotely" as const;
  readonly displayName = "We Work Remotely";

  isEnabled(): boolean {
    return true;
  }

  async fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]> {
    const url = "https://weworkremotely.com/categories/remote-programming-jobs.rss";

    const res = await fetchWithTimeout(url, { timeoutMs: options?.timeoutMs });
    if (!res.ok) {
      throw new Error(`WeWorkRemotely RSS feed returned status ${res.status}: ${res.statusText}`);
    }

    const xmlText = await res.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const parsed = parser.parse(xmlText);
    const channel = parsed?.rss?.channel;
    if (!channel || !channel.item) {
      return [];
    }

    const rawItems: RssItem[] = Array.isArray(channel.item) ? channel.item : [channel.item];
    const limit = options?.limit ?? 40;
    const items = rawItems.slice(0, limit);

    return items
      .filter((item) => item.title && item.link)
      .map((item) => {
        const fullTitle = String(item.title || "").trim();
        let company = "We Work Remotely";
        let title = fullTitle;

        // WWR title format is commonly "Company Name: Job Title"
        const colonIdx = fullTitle.indexOf(":");
        if (colonIdx > 0) {
          company = fullTitle.slice(0, colonIdx).trim();
          title = fullTitle.slice(colonIdx + 1).trim();
        }

        const guidVal = typeof item.guid === "object" ? item.guid["#text"] : item.guid;
        const externalId = guidVal || null;
        const jobUrl = String(item.link).trim();
        const applyUrl = jobUrl;
        const dedupKey = generateDedupKey(this.sourceName, externalId, jobUrl);

        let postedAt: Date | null = null;
        if (item.pubDate) {
          const parsedDate = new Date(item.pubDate);
          if (!isNaN(parsedDate.getTime())) {
            postedAt = parsedDate;
          }
        }

        return {
          source: this.sourceName,
          externalId,
          dedupKey,
          title,
          company,
          companyLogo: null,
          location: item.region ? String(item.region).trim() : "Worldwide / Remote",
          isRemote: true,
          salary: null,
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: null,
          description: item.description ? String(item.description) : `${title} at ${company}`,
          jobUrl,
          applyUrl,
          postedAt,
        };
      });
  }
}
