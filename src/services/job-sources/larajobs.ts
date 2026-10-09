import { XMLParser } from "fast-xml-parser";
import { FetchOptions, JobSourceAdapter, NormalizedJob } from "@/types/job";
import { generateDedupKey } from "@/services/normalizer";
import { fetchWithTimeout } from "./base";

interface LaraJobsItemRaw {
  title?: string;
  link?: string;
  pubDate?: string;
  "dc:creator"?: string;
  "job:company"?: string;
  "job:company_logo"?: string;
  "job:location"?: string;
  "job:job_type"?: string;
  "job:salary"?: string;
  "job:tags"?: string;
  guid?: string | { "#text"?: string };
  description?: string;
  "content:encoded"?: string;
}

export class LaraJobsAdapter implements JobSourceAdapter {
  readonly sourceName = "LaraJobs" as const;
  readonly displayName = "LaraJobs";

  isEnabled(): boolean {
    return true;
  }

  async fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]> {
    const url = "https://larajobs.com/feed";

    const res = await fetchWithTimeout(url, {
      timeoutMs: options?.timeoutMs,
      headers: {
        Accept: "application/xml, text/xml, */*",
      },
    });

    if (!res.ok) {
      throw new Error(`LaraJobs RSS feed returned status ${res.status}: ${res.statusText}`);
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

    const rawItems: LaraJobsItemRaw[] = Array.isArray(channel.item) ? channel.item : [channel.item];
    const limit = options?.limit ?? 40;
    const items = rawItems.slice(0, limit);

    return items
      .filter((item) => item.title && item.link)
      .map((item) => {
        const title = String(item.title).trim();
        const company = String(item["job:company"] || item["dc:creator"] || "LaraJobs").trim();
        const jobUrl = String(item.link).trim();
        const applyUrl = jobUrl;

        const guidVal = typeof item.guid === "object" ? item.guid["#text"] : item.guid;
        const linkMatch = jobUrl.match(/\/job\/(\d+)/i);
        const externalId = linkMatch ? linkMatch[1] : (guidVal ? String(guidVal).trim() : null);
        const dedupKey = generateDedupKey(this.sourceName, externalId, jobUrl);

        const rawSalary = item["job:salary"] ? String(item["job:salary"]).trim() : null;
        let salaryMin: number | null = null;
        let salaryMax: number | null = null;
        let salaryCurrency: string | null = null;

        if (rawSalary) {
          const numbers = rawSalary.replace(/,/g, "").match(/\d[\d.]*/g);
          if (numbers && numbers.length >= 2) {
            salaryMin = parseFloat(numbers[0]);
            salaryMax = parseFloat(numbers[1]);
          } else if (numbers && numbers.length === 1) {
            salaryMin = parseFloat(numbers[0]);
          }
          if (rawSalary.includes("$")) salaryCurrency = "USD";
          else if (rawSalary.includes("€")) salaryCurrency = "EUR";
          else if (rawSalary.includes("£")) salaryCurrency = "GBP";
        }

        let postedAt: Date | null = null;
        if (item.pubDate) {
          const parsedDate = new Date(item.pubDate);
          if (!isNaN(parsedDate.getTime())) {
            postedAt = parsedDate;
          }
        }

        const rawDesc = item["content:encoded"] || item.description || "";
        const description = rawDesc.trim().length > 0 ? String(rawDesc).trim() : `${title} at ${company}`;
        const location = item["job:location"] ? String(item["job:location"]).trim() : "Remote";

        return {
          source: this.sourceName,
          externalId,
          dedupKey,
          title,
          company,
          companyLogo: item["job:company_logo"] ? String(item["job:company_logo"]).trim() : null,
          location,
          isRemote: true,
          salary: rawSalary,
          salaryMin,
          salaryMax,
          salaryCurrency,
          description,
          jobUrl,
          applyUrl,
          postedAt,
        };
      });
  }
}
