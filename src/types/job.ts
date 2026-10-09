export type JobSource =
  | "Himalayas"
  | "Remotive"
  | "Jobicy"
  | "RemoteJobsOrg"
  | "RemoteLanders"
  | "Arbeitnow"
  | "WeWorkRemotely"
  | "RemoteOK"
  | "WorkingNomads"
  | "LaraJobs";

export type ApplicationStatus =
  | "NEW"
  | "SAVED"
  | "APPLY"
  | "APPLIED"
  | "INTERVIEW"
  | "TECHNICAL_INTERVIEW"
  | "FINAL_INTERVIEW"
  | "OFFER"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface CandidateProfileData {
  id?: string;
  name?: string;
  targetRoles: string[];
  skills: string[];
  minExperienceYears: number;
  remoteOnly: boolean;
  preferredLocations: string[];
  minSalary?: number | null;
  salaryCurrency?: string;
}

export interface MatchDetails {
  titleScore: number;
  skillsScore: number;
  remoteScore: number;
  experienceScore: number;
  locationScore: number;
  totalScore: number;
  matchedRoles: string[];
  matchedSkills: string[];
  isRemoteMatched: boolean;
  isLocationMatched: boolean;
}

export interface NormalizedJob {
  source: JobSource;
  externalId: string | null;
  dedupKey: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string | null;
  isRemote: boolean;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  description: string;
  jobUrl: string;
  applyUrl: string;
  postedAt: Date | null;
}

export interface FetchOptions {
  limit?: number;
  page?: number;
  timeoutMs?: number;
}

export interface JobSourceAdapter {
  readonly sourceName: JobSource;
  readonly displayName: string;
  isEnabled(): boolean;
  fetchJobs(options?: FetchOptions): Promise<NormalizedJob[]>;
}

export interface SyncResult {
  source: string;
  success: boolean;
  fetchedCount: number;
  savedCount: number;
  error?: string;
  durationMs: number;
}

export interface AggregatedSyncResult {
  totalFetched: number;
  totalSaved: number;
  durationMs: number;
  sources: SyncResult[];
}
