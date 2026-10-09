import { CandidateProfileData, MatchDetails, NormalizedJob } from "@/types/job";
import { cleanHtmlText } from "./normalizer";

// Default candidate profile fallback
export const DEFAULT_CANDIDATE_PROFILE: CandidateProfileData = {
  targetRoles: [
    "Senior Software Engineer",
    "Senior Node.js Developer",
    "Senior Full-Stack Engineer",
    "AI & Integrations Engineer",
    "Backend Developer",
    "Node.js Developer",
  ],
  skills: [
    "JavaScript",
    "TypeScript",
    "Node.js",
    "NestJS",
    "React.js",
    "Next.js",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "AWS",
    "Docker",
    "CI/CD",
    "AI APIs",
    "Travel APIs",
    "Tailwind CSS",
  ],
  minExperienceYears: 5,
  remoteOnly: true,
  preferredLocations: ["International", "Remote", "Worldwide", "Anywhere"],
  minSalary: 100000,
  salaryCurrency: "BDT",
};

/**
 * Calculates a rules-based match score (0 - 100) and breakdown
 * between a candidate profile and a normalized job.
 * Absolutely no LLM is used.
 */
export function calculateJobMatch(
  job: Pick<NormalizedJob, "title" | "description" | "location" | "isRemote" | "salary">,
  profile: CandidateProfileData = DEFAULT_CANDIDATE_PROFILE
): MatchDetails {
  const titleLower = job.title.toLowerCase();
  const rawText = `${job.title} ${cleanHtmlText(job.description)}`.toLowerCase();
  const locationLower = (job.location || "").toLowerCase();

  // 1. Title match (Max: 35 points)
  let titleScore = 0;
  const matchedRoles: string[] = [];
  const juniorKeywords = ["junior", "jr.", "entry level", "intern", "internship", "graduate"];
  const isJuniorJob = juniorKeywords.some((w) => titleLower.includes(w));

  for (const role of profile.targetRoles) {
    const roleLower = role.toLowerCase();
    if (titleLower.includes(roleLower)) {
      matchedRoles.push(role);
      titleScore = Math.max(titleScore, isJuniorJob ? 15 : 35);
    }
  }

  if (titleScore < 35 && !isJuniorJob) {
    // Partial role token matching
    const seniorKeywords = ["senior", "lead", "sr.", "staff", "principal"];
    const techKeywords = ["node", "full stack", "full-stack", "backend", "software", "engineer", "developer", "ai", "integrations"];

    const hasSenior = seniorKeywords.some((w) => titleLower.includes(w));
    const matchedTechs = techKeywords.filter((w) => titleLower.includes(w));

    if (hasSenior && matchedTechs.length >= 2) {
      titleScore = Math.max(titleScore, 30);
    } else if (matchedTechs.length >= 2) {
      titleScore = Math.max(titleScore, 24);
    } else if (hasSenior && matchedTechs.length === 1) {
      titleScore = Math.max(titleScore, 20);
    } else if (matchedTechs.length === 1) {
      titleScore = Math.max(titleScore, 12);
    }
  }

  // 2. Skills match (Max: 35 points)
  const matchedSkills: string[] = [];
  const skillAliases: Record<string, string[]> = {
    javascript: ["javascript", "js", "ecmascript"],
    typescript: ["typescript", "ts"],
    "node.js": ["node.js", "nodejs", "node"],
    nestjs: ["nestjs", "nest.js", "nest"],
    "react.js": ["react.js", "reactjs", "react"],
    "next.js": ["next.js", "nextjs", "next"],
    postgresql: ["postgresql", "postgres", "psql"],
    mysql: ["mysql"],
    mongodb: ["mongodb", "mongo"],
    redis: ["redis"],
    aws: ["aws", "amazon web services", "ec2", "s3", "lambda"],
    docker: ["docker", "container", "containers"],
    "ci/cd": ["ci/cd", "ci-cd", "github actions", "gitlab ci", "continuous integration"],
    "ai apis": ["ai api", "ai apis", "openai", "anthropic", "gemini", "llm", "langchain", "rag"],
    "travel apis": ["travel api", "travel apis", "amadeus", "sabre", "ota", "gds", "flight api"],
    "tailwind css": ["tailwind", "tailwindcss", "tailwind css"],
  };

  for (const skill of profile.skills) {
    const key = skill.toLowerCase();
    const aliases = skillAliases[key] || [key];
    const isMatched = aliases.some((alias) => {
      // Escape for regex boundary
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escaped}([^a-zA-Z0-9_]|$)`, "i");
      return regex.test(rawText);
    });

    if (isMatched) {
      matchedSkills.push(skill);
    }
  }

  // Score proportional to matched skills count
  let skillsScore = 0;
  const count = matchedSkills.length;
  if (count >= 6) {
    skillsScore = 35;
  } else if (count === 5) {
    skillsScore = 32;
  } else if (count === 4) {
    skillsScore = 27;
  } else if (count === 3) {
    skillsScore = 21;
  } else if (count === 2) {
    skillsScore = 15;
  } else if (count === 1) {
    skillsScore = 8;
  }

  // 3. Remote eligibility (Max: 15 points)
  let remoteScore = 0;
  const isRemoteMatched =
    job.isRemote ||
    rawText.includes("remote") ||
    locationLower.includes("remote") ||
    locationLower.includes("worldwide") ||
    locationLower.includes("anywhere");

  if (profile.remoteOnly) {
    if (isRemoteMatched) {
      remoteScore = 15;
    } else {
      remoteScore = 0;
    }
  } else {
    remoteScore = 15;
  }

  // 4. Experience relevance (Max: 10 points)
  let experienceScore = 6; // default neutral
  const seniorExpTerms = ["senior", "lead", "sr.", "staff", "principal", "5+ years", "5 years", "5+", "6+ years", "7+ years"];
  const juniorExpTerms = ["junior", "entry level", "intern", "internship", "0-1 years", "graduate"];

  if (seniorExpTerms.some((t) => titleLower.includes(t) || rawText.includes(t))) {
    experienceScore = 10;
  } else if (juniorExpTerms.some((t) => titleLower.includes(t))) {
    experienceScore = 2;
  } else if (rawText.includes("3+ years") || rawText.includes("4+ years") || rawText.includes("mid-level")) {
    experienceScore = 8;
  }

  // 5. Location eligibility (Max: 5 points)
  let locationScore = 2;
  let isLocationMatched = false;
  const globalIndicators = [
    "worldwide",
    "anywhere",
    "global",
    "international",
    "all countries",
    "remote - worldwide",
    "anywhere in the world",
  ];

  if (
    globalIndicators.some((g) => locationLower.includes(g) || rawText.includes(g)) ||
    locationLower === "remote" ||
    locationLower === ""
  ) {
    locationScore = 5;
    isLocationMatched = true;
  } else if (
    locationLower.includes("usa only") ||
    locationLower.includes("us only") ||
    locationLower.includes("us citizens")
  ) {
    locationScore = 0;
    isLocationMatched = false;
  } else {
    locationScore = 3;
    isLocationMatched = true;
  }

  const totalScore = Math.min(
    100,
    Math.round(titleScore + skillsScore + remoteScore + experienceScore + locationScore)
  );

  return {
    titleScore,
    skillsScore,
    remoteScore,
    experienceScore,
    locationScore,
    totalScore,
    matchedRoles,
    matchedSkills,
    isRemoteMatched,
    isLocationMatched,
  };
}
