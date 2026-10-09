import { describe, it, expect } from "vitest";
import { calculateJobMatch, DEFAULT_CANDIDATE_PROFILE } from "@/services/scorer";

describe("Candidate Profile Rules-Based Match Scorer", () => {
  it("scores highly on an ideal Senior Full-Stack / Node.js match", () => {
    const job = {
      title: "Senior Full-Stack Engineer (Node.js & TypeScript)",
      description: `
        We are seeking a Senior Full-Stack Engineer with 5+ years of experience.
        Required Tech Stack:
        - Node.js and TypeScript
        - React.js and Next.js
        - PostgreSQL, Redis
        - Docker and AWS deployment
        - Experience with AI APIs is a huge plus!
        This is a 100% remote worldwide position.
      `,
      location: "Remote - Worldwide",
      isRemote: true,
      salary: "$120,000 - $150,000",
    };

    const match = calculateJobMatch(job, DEFAULT_CANDIDATE_PROFILE);

    expect(match.totalScore).toBeGreaterThanOrEqual(80);
    expect(match.titleScore).toBeGreaterThanOrEqual(30);
    expect(match.skillsScore).toBeGreaterThanOrEqual(25);
    expect(match.remoteScore).toBe(15);
    expect(match.experienceScore).toBe(10);
    expect(match.matchedSkills).toContain("TypeScript");
    expect(match.matchedSkills).toContain("Node.js");
    expect(match.matchedSkills).toContain("React.js");
    expect(match.matchedSkills).toContain("PostgreSQL");
    expect(match.matchedSkills).toContain("AWS");
    expect(match.matchedSkills).toContain("Docker");
    expect(match.isRemoteMatched).toBe(true);
  });

  it("scores low on unrelated positions (e.g. Sales / Marketing)", () => {
    const job = {
      title: "Senior Marketing Manager",
      description: "Drive sales funnel and content strategy for digital advertising. Requires SEO experience.",
      location: "Chicago, IL (On-site)",
      isRemote: false,
      salary: "$80,000",
    };

    const match = calculateJobMatch(job, DEFAULT_CANDIDATE_PROFILE);

    expect(match.totalScore).toBeLessThan(40);
    expect(match.matchedSkills.length).toBe(0);
    expect(match.remoteScore).toBe(0);
  });

  it("handles partial tech matches and junior penalties", () => {
    const job = {
      title: "Junior Backend Developer",
      description: "Entry-level position. Must know basic JavaScript and MySQL. Mentorship provided.",
      location: "Remote",
      isRemote: true,
      salary: null,
    };

    const match = calculateJobMatch(job, DEFAULT_CANDIDATE_PROFILE);

    expect(match.experienceScore).toBe(2); // junior penalty
    expect(match.matchedSkills).toContain("JavaScript");
    expect(match.matchedSkills).toContain("MySQL");
    expect(match.totalScore).toBeLessThan(60);
  });

  it("detects AI APIs and travel APIs when present in job description", () => {
    const job = {
      title: "AI & Integrations Engineer",
      description: "Build LLM applications using OpenAI AI APIs and travel APIs (Amadeus, Sabre). NestJS backend.",
      location: "Remote, Worldwide",
      isRemote: true,
      salary: "$110,000",
    };

    const match = calculateJobMatch(job, DEFAULT_CANDIDATE_PROFILE);

    expect(match.matchedRoles).toContain("AI & Integrations Engineer");
    expect(match.matchedSkills).toContain("AI APIs");
    expect(match.matchedSkills).toContain("Travel APIs");
    expect(match.matchedSkills).toContain("NestJS");
    expect(match.totalScore).toBeGreaterThanOrEqual(80);
  });
});
