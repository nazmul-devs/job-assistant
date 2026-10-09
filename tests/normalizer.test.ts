import { describe, it, expect } from "vitest";
import { normalizeJobUrl, generateDedupKey, cleanHtmlText } from "@/services/normalizer";

describe("Job Normalizer & URL Canonicalization", () => {
  it("strips tracking query parameters from job URLs", () => {
    const rawUrl =
      "https://example.com/jobs/senior-dev?utm_source=linkedin&utm_medium=cpc&ref=aggregator#apply";
    const normalized = normalizeJobUrl(rawUrl);
    expect(normalized).toBe("https://example.com/jobs/senior-dev#apply");
    expect(normalized).not.toContain("utm_source");
    expect(normalized).not.toContain("utm_medium");
    expect(normalized).not.toContain("ref=");
  });

  it("normalizes case and trailing slashes consistently", () => {
    const url1 = "https://EXAMPLE.com/jobs/senior-engineer/";
    const url2 = "https://example.com/jobs/senior-engineer";
    expect(normalizeJobUrl(url1)).toBe(normalizeJobUrl(url2));
  });

  it("cleans HTML tags and entities properly", () => {
    const dirtyHtml =
      "<div><p>Looking for a <strong>Senior Developer</strong> &amp; architect.&nbsp;Must know TypeScript.</p></div>";
    const cleaned = cleanHtmlText(dirtyHtml);
    expect(cleaned).toBe("Looking for a Senior Developer & architect. Must know TypeScript.");
  });
});

describe("Deterministic Deduplication Key Generation", () => {
  it("uses externalId when available", () => {
    const key = generateDedupKey("Himalayas", "job_12345", "https://himalayas.app/jobs/12345");
    expect(key).toBe("himalayas:id:job_12345");
  });

  it("falls back to canonical url hash when externalId is absent", () => {
    const key1 = generateDedupKey("Remotive", null, "https://remotive.com/jobs/senior-node-dev?utm_source=twitter");
    const key2 = generateDedupKey("Remotive", null, "https://remotive.com/jobs/senior-node-dev?utm_medium=feed");
    expect(key1).toBe(key2);
    expect(key1).toMatch(/^remotive:url:[a-f0-9]{32}$/);
  });

  it("produces distinct keys for different sources even with identical IDs", () => {
    const key1 = generateDedupKey("Remotive", "123", "https://remotive.com/jobs/123");
    const key2 = generateDedupKey("Jobicy", "123", "https://jobicy.com/jobs/123");
    expect(key1).not.toBe(key2);
  });
});
