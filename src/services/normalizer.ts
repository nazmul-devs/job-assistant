import { createHash } from "crypto";
import { JobSource } from "@/types/job";

/**
 * Normalizes a URL by stripping tracking params (UTM, fbclid, ref, etc.)
 * and lower-casing hostname/protocol for consistent deduplication.
 */
export function normalizeJobUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const trimmed = rawUrl.trim();
    const url = new URL(trimmed);
    url.hostname = url.hostname.toLowerCase();
    url.protocol = url.protocol.toLowerCase();

    // Strip common tracking parameters
    const paramsToStrip = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "source",
      "fbclid",
      "gclid",
      "trk",
      "position",
      "entry_point",
    ];

    for (const param of paramsToStrip) {
      url.searchParams.delete(param);
    }

    let normalized = url.toString();
    // Normalize trailing slash if path ends with / and is not just root
    if (normalized.endsWith("/") && url.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    // If not a parseable URL, sanitize whitespace and lowercase
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Creates a unique deterministic deduplication key for a job.
 * Strategy:
 * - If externalId is present: `${source}:${externalId}`
 * - Otherwise: `${source}:${sha256(canonicalJobUrl)}`
 */
export function generateDedupKey(
  source: JobSource,
  externalId: string | null | undefined,
  jobUrl: string
): string {
  const cleanSource = source.trim().toLowerCase();
  const trimmedId = externalId ? String(externalId).trim() : "";

  if (trimmedId.length > 0) {
    return `${cleanSource}:id:${trimmedId}`;
  }

  const normalizedUrl = normalizeJobUrl(jobUrl);
  const hash = createHash("sha256").update(normalizedUrl).digest("hex").slice(0, 32);
  return `${cleanSource}:url:${hash}`;
}

/**
 * Cleans HTML tags and entities from raw job descriptions if needed.
 */
export function cleanHtmlText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
